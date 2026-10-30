import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestTriggerInfo,
} from "obsidian";

import { PLACEHOLDER_NAMES } from "src/jalali/placeholders";
import { parsePlaceholderTrigger } from "src/jalali/references";
import type { ISettings } from "src/settings";

/** `{{` suggests the Persian template placeholders. */
export default class PlaceholderSuggest extends EditorSuggest<string> {
  constructor(app: App, private getSettings: () => ISettings) {
    super(app);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor
  ): EditorSuggestTriggerInfo | null {
    if (this.getSettings().calendarMode !== "jalali") {
      return null;
    }
    const line = editor.getLine(cursor.line);
    const trigger = parsePlaceholderTrigger(
      line.slice(0, cursor.ch),
      line.slice(cursor.ch)
    );
    if (!trigger) {
      return null;
    }
    return {
      start: { line: cursor.line, ch: trigger.start },
      end: { line: cursor.line, ch: trigger.end },
      query: trigger.query,
    };
  }

  getSuggestions({ query }: { query: string }): string[] {
    return PLACEHOLDER_NAMES.filter((name) => name.includes(query));
  }

  renderSuggestion(name: string, el: HTMLElement): void {
    el.setText(name);
  }

  selectSuggestion(name: string): void {
    const { editor, start, end } = this.context;
    editor.replaceRange(`{{${name}}}`, start, end);
  }
}
