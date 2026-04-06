import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CognitiveMode } from '../types';

export class ExplanationViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'cognitiveCodCompanion.explanationView';

  private view?: vscode.WebviewView;

  // Fire when the user changes the mode dropdown while an explanation is visible
  private readonly _onDidChangeMode = new vscode.EventEmitter<CognitiveMode>();
  public readonly onDidChangeMode = this._onDidChangeMode.event;

  /** Whether the panel is currently showing an explanation (not empty / loading / error). */
  private hasExplanation = false;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    // Sync the current mode setting to the dropdown
    const config = vscode.workspace.getConfiguration('cognitiveCodCompanion');
    const currentMode = config.get<CognitiveMode>('explanationStyle', 'step-by-step');
    this.postMessage({ type: 'setMode', mode: currentMode });

    // Listen for mode changes from the webview dropdown
    webviewView.webview.onDidReceiveMessage((message: { type: string; mode: string }) => {
      if (message.type === 'modeChange') {
        const newMode = message.mode as CognitiveMode;

        // Persist the setting
        vscode.workspace
          .getConfiguration('cognitiveCodCompanion')
          .update('explanationStyle', newMode, vscode.ConfigurationTarget.Global);

        // If we already have an explanation showing, re-fetch with the new mode
        if (this.hasExplanation) {
          this._onDidChangeMode.fire(newMode);
        }
      }
    });
  }

  public showLoading(): void {
    this.postMessage({ type: 'loading' });
    // Don't clear hasExplanation here — we're loading a replacement
  }

  public showExplanation(html: string, mode: CognitiveMode): void {
    this.hasExplanation = true;
    this.postMessage({ type: 'setMode', mode });
    this.postMessage({ type: 'explanation', html });
  }

  public showError(message: string): void {
    this.hasExplanation = false;
    this.postMessage({ type: 'error', message });
  }

  public reveal(): void {
    if (this.view) {
      this.view.show(true);
    }
  }

  public dispose(): void {
    this._onDidChangeMode.dispose();
  }

  private postMessage(message: Record<string, unknown>): void {
    this.view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const htmlPath = path.join(this.extensionUri.fsPath, 'out', 'webview', 'webview.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const nonce = getNonce();
    html = html.replace(/\{\{nonce\}\}/g, nonce);

    // Webview needs a proper base for CSP
    void webview;

    return html;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
