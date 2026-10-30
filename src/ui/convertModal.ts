import { App, Editor, MarkdownView, Modal, Notice, Setting } from "obsidian";

import { ConvertSource, convertDate } from "src/jalali/convert";
import { formatJalali } from "src/jalali/dates";

const pad = (n: number) => String(n).padStart(2, "0");

function todayAs(source: ConvertSource): string {
  const now = new Date();
  return source === "jalali"
    ? formatJalali(now, "jYYYY-jMM-jDD")
    : `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Type a date in one calendar, see it in the other; insert or copy the result. */
export class ConvertDateModal extends Modal {
  private source: ConvertSource;
  private text: string;
  private editor: Editor | null;
  private resultEl: HTMLElement;
  private insertBtn: HTMLButtonElement;
  private copyBtn: HTMLButtonElement;
  private converted: ReturnType<typeof convertDate> = null;

  constructor(app: App, defaultSource: ConvertSource) {
    super(app);
    this.source = defaultSource;
    this.text = todayAs(defaultSource);
    // Grab the editor now: it is the one the user was in when they opened this.
    this.editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor ?? null;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Convert date" });

    new Setting(contentEl).setName("From calendar").addDropdown((dropdown) => {
      dropdown.addOption("gregorian", "Gregorian");
      dropdown.addOption("jalali", "Jalali (شمسی)");
      dropdown.setValue(this.source);
      dropdown.onChange((value) => {
        this.source = value as ConvertSource;
        this.text = todayAs(this.source);
        input.setValue(this.text);
        this.update();
      });
    });

    let input: { setValue(v: string): unknown };
    new Setting(contentEl)
      .setName("Date")
      .setDesc("Year-month-day, e.g. 2026-10-30 or 1405-08-08")
      .addText((textfield) => {
        input = textfield;
        textfield.setValue(this.text);
        textfield.onChange((value) => {
          this.text = value;
          this.update();
        });
        textfield.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.converted) {
            this.insert();
          }
        });
        window.setTimeout(() => textfield.inputEl.select(), 0);
      });

    this.resultEl = contentEl.createDiv("calendar-convert-result");

    contentEl.createDiv("modal-button-container", (buttons) => {
      this.copyBtn = buttons.createEl("button", { text: "Copy" });
      this.copyBtn.addEventListener("click", () => this.copy());
      this.insertBtn = buttons.createEl("button", {
        cls: "mod-cta",
        text: "Insert at cursor",
      });
      this.insertBtn.addEventListener("click", () => this.insert());
    });

    this.update();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  /** The converted date in the calendar the user did not type. */
  private get output(): string | null {
    if (!this.converted) {
      return null;
    }
    return this.source === "jalali"
      ? this.converted.gregorian
      : this.converted.jalali;
  }

  private update(): void {
    this.converted = convertDate(this.text, this.source);
    this.resultEl.empty();

    if (!this.converted) {
      this.resultEl.createEl("p", {
        cls: "setting-item-description",
        text: "Not a valid date in that calendar.",
      });
    } else {
      const { gregorian, gregorianLong, jalali, jalaliLong } = this.converted;
      const row = (label: string, numeric: string, long: string) => {
        const p = this.resultEl.createEl("p");
        p.createEl("strong", { text: `${label}: ` });
        p.appendText(`${numeric}  ·  ${long}`);
      };
      row("Gregorian", gregorian, gregorianLong);
      row("Jalali", jalali, jalaliLong);
    }

    this.copyBtn.disabled = !this.converted;
    this.insertBtn.disabled = !this.converted || !this.editor;
    this.insertBtn.title = this.editor ? "" : "Open a note to insert into";
  }

  private insert(): void {
    if (!this.output || !this.editor) {
      return;
    }
    this.editor.replaceSelection(this.output);
    this.close();
  }

  private async copy(): Promise<void> {
    if (!this.output) {
      return;
    }
    await navigator.clipboard.writeText(this.output);
    new Notice(`Copied ${this.output}`);
  }
}
