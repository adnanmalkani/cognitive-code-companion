import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  try {
    // Import dependencies inside activate to catch any load errors
    const { ExplanationViewProvider } = require('./webview/webviewProvider');
    const { getExplanationFromOpenRouter } = require('./openrouterClient');
    const { renderMarkdown } = require('./markdownRenderer');

    const provider = new ExplanationViewProvider(context.extensionUri);

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('cognitiveCodCompanion.explanationView', provider)
    );

    // Keep track of the last request so we can re-explain when the mode changes
    let lastCode: string | undefined;
    let lastLanguageId: string | undefined;

    /**
     * Core helper that makes the API call and renders the result.
     * Used by both the initial command and mode-change re-fetches.
     */
    async function fetchExplanation(mode: string) {
      if (!lastCode || !lastLanguageId) {
        return;
      }

      const config = vscode.workspace.getConfiguration('cognitiveCodCompanion');
      const apiKey = config.get<string>('apiKey', '');

      if (!apiKey) {
        provider.showError('API key not set. Please configure your OpenRouter API key in settings.');
        return;
      }

      const model = config.get<string>('model', 'nvidia/nemotron-3-super-120b-a12b:free');
      const responseLanguage = config.get<string>('language', 'English');

      provider.showLoading();

      try {
        const result = await getExplanationFromOpenRouter(apiKey, model, {
          code: lastCode,
          languageId: lastLanguageId,
          mode,
          responseLanguage,
        });

        const html = renderMarkdown(result.explanation);
        provider.showExplanation(html, result.mode);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An unknown error occurred.';
        provider.showError(message);
      }
    }

    // Re-fetch the explanation whenever the user changes the cognitive mode dropdown
    context.subscriptions.push(
      provider.onDidChangeMode(async (newMode: string) => {
        await fetchExplanation(newMode);
      })
    );

    const explainCommand = vscode.commands.registerCommand(
      'cognitiveCodCompanion.explainCode',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showInformationMessage('Open a file and select code to explain.');
          return;
        }

        const selection = editor.selection;
        const code = editor.document.getText(selection);
        if (!code.trim()) {
          vscode.window.showWarningMessage('Select some code first, then run "Explain This Code".',
            { modal: true });
          return;
        }

        const config = vscode.workspace.getConfiguration('cognitiveCodCompanion');
        const apiKey = config.get<string>('apiKey', '');

        if (!apiKey) {
          const action = await vscode.window.showWarningMessage(
            'Please set your OpenRouter API key first.',
            { modal: true },
            'Open Settings'
          );
          if (action === 'Open Settings') {
            vscode.commands.executeCommand(
              'workbench.action.openSettings',
              'cognitiveCodCompanion.apiKey'
            );
          }
          return;
        }

        const mode = config.get<string>('explanationStyle', 'step-by-step');
        const languageId = editor.document.languageId;

        // Store for re-use on mode changes
        lastCode = code;
        lastLanguageId = languageId;

        // Force open the sidebar panel
        await vscode.commands.executeCommand('cognitiveCodCompanion.explanationView.focus');

        await fetchExplanation(mode);
      }
    );

    context.subscriptions.push(explainCommand);
    vscode.window.showInformationMessage('Cognitive Code Companion is active!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Cognitive Code Companion failed to activate: ${msg}`);
    console.error('Cognitive Code Companion activation error:', err);
  }
}

export function deactivate() {}
