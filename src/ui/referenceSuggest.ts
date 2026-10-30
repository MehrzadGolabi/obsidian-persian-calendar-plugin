import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestTriggerInfo,
  Notice,
  TFile,
} from "obsidian";

import {
  findJalaliDateForFile,
  getJalaliNoteName,
  getOrCreateJalaliNote,
} from "src/io/jalali/notes";
import {
  getReferencePhrases,
  IReferencePhrase,
  parseReferenceTrigger,
  resolveReference,
} from "src/jalali/references";
import type { ISettings } from "src/settings";

/**
 * `@` suggests calendar notes (picking one inserts a link, creating the note
 * if needed); `@/` inserts the resolved date as plain text instead.
 */
export default class ReferenceSuggest extends EditorSuggest<IReferencePhrase> {
  private plain = false;

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
    const prefix = editor.getLine(cursor.line).slice(0, cursor.ch);
    const trigger = parseReferenceTrigger(prefix);
    if (!trigger) {
      return null;
    }
    this.plain = trigger.plain;
    return {
      start: { line: cursor.line, ch: trigger.start },
      end: cursor,
      query: trigger.query,
    };
  }

  getSuggestions({ query }: { query: string }): IReferencePhrase[] {
    return getReferencePhrases(new Date()).filter((phrase) =>
      phrase.label.includes(query.trim())
    );
  }

  renderSuggestion(phrase: IReferencePhrase, el: HTMLElement): void {
    el.setText(phrase.label);
  }

  selectSuggestion(phrase: IReferencePhrase): void {
    const { editor, file, start, end } = this.context;
    this.insert(phrase, editor, file, start, end).catch((err) => {
      console.error("Failed to insert the calendar note reference", err);
      new Notice("Could not create the calendar note");
    });
  }

  private async insert(
    phrase: IReferencePhrase,
    editor: Editor,
    file: TFile | null,
    start: EditorPosition,
    end: EditorPosition
  ): Promise<void> {
    const settings = this.getSettings();
    const openNoteDate = file ? findJalaliDateForFile(settings, file) : null;
    const { period, date } = resolveReference(phrase, openNoteDate, new Date());

    if (this.plain) {
      editor.replaceRange(getJalaliNoteName(settings, period, date), start, end);
      return;
    }
    const typed = editor.getRange(start, end);
    const note = await getOrCreateJalaliNote(settings, period, date);
    const link = this.app.fileManager.generateMarkdownLink(
      note,
      file?.path ?? "",
      undefined,
      phrase.label
    );
    // Creating the note is async; if the text changed meanwhile, the saved
    // positions are stale, so insert at the cursor instead.
    if (editor.getRange(start, end) === typed) {
      editor.replaceRange(link, start, end);
    } else {
      editor.replaceSelection(link);
    }
  }
}
