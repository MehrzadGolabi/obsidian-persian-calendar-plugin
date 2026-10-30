import type { Moment } from "moment";
import {
  getDailyNote,
  getDailyNoteSettings,
  getDateFromFile,
  getWeeklyNote,
  getWeeklyNoteSettings,
  getMonthlyNote,
  getMonthlyNoteSettings,
  getYearlyNote,
  getYearlyNoteSettings,
  getQuarterlyNote,
  getQuarterlyNoteSettings,
} from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { tryToCreateMonthlyNote } from "src/io/monthlyNotes";
import { tryToCreateYearlyNote } from "src/io/yearlyNotes";
import { tryToCreateQuarterlyNote } from "src/io/quarterlyNotes";
import {
  findJalaliDateForFile,
  getJalaliNote,
  openOrCreateJalaliNote,
} from "src/io/jalali/notes";
import { formatJalali, JalaliPeriod, startOfJalaliPeriod } from "src/jalali/dates";
import { getJalaliNoteConfig, CalendarMode, ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import {
  activeFile,
  activeFilePath,
  jalaliRevision,
  dailyNotes,
  weeklyNotes,
  monthlyNotes,
  quarterlyNotes, // Added quarterlyNotes
  yearlyNotes,
  settings,
} from "./ui/stores";
import {
  customTagsSource,
  streakSource,
  tasksSource,
  wordCountSource,
} from "./ui/sources";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly setCalendarMode: (mode: CalendarMode) => void
  ) {
    super(leaf);

    this.openOrCreateJalaliNote = this.openOrCreateJalaliNote.bind(this);
    this.onHoverJalali = this.onHoverJalali.bind(this);
    this.onContextMenuJalali = this.onContextMenuJalali.bind(this);
    this.onJalaliNotesChanged = this.onJalaliNotesChanged.bind(this);

    this.openOrCreateDailyNote = this.openOrCreateDailyNote.bind(this);
    this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);
    this.openOrCreateMonthlyNote = this.openOrCreateMonthlyNote.bind(this);
    this.openOrCreateYearlyNote = this.openOrCreateYearlyNote.bind(this);
    this.openOrCreateQuarterlyNote = this.openOrCreateQuarterlyNote.bind(this); // Added binding

    this.onNoteSettingsUpdate = this.onNoteSettingsUpdate.bind(this);
    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);
    this.onFileModified = this.onFileModified.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);

    this.onHoverDay = this.onHoverDay.bind(this);
    this.onHoverWeek = this.onHoverWeek.bind(this);
    this.onHoverMonth = this.onHoverMonth.bind(this);
    this.onHoverYear = this.onHoverYear.bind(this);
    this.onHoverQuarter = this.onHoverQuarter.bind(this); // Added binding

    this.onContextMenuDay = this.onContextMenuDay.bind(this);
    this.onContextMenuWeek = this.onContextMenuWeek.bind(this);
    this.onContextMenuMonth = this.onContextMenuMonth.bind(this);
    this.onContextMenuYear = this.onContextMenuYear.bind(this);
    this.onContextMenuQuarter = this.onContextMenuQuarter.bind(this); // Added binding

    this.registerEvent(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>this.app.workspace).on(
        "periodic-notes:settings-updated",
        this.onNoteSettingsUpdate
      )
    );
    this.registerEvent(this.app.vault.on("create", this.onFileCreated));
    this.registerEvent(this.app.vault.on("delete", this.onFileDeleted));
    this.registerEvent(this.app.vault.on("modify", this.onFileModified));
    this.registerEvent(this.app.vault.on("create", this.onJalaliNotesChanged));
    this.registerEvent(this.app.vault.on("delete", this.onJalaliNotesChanged));
    this.registerEvent(this.app.vault.on("rename", this.onJalaliNotesChanged));
    this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen));

    this.settings = null;
    settings.subscribe((val) => {
      this.settings = val;

      // Refresh the calendar if settings change
      if (this.calendar) {
        this.calendar.tick();
      }
    });
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return "Calendar";
  }

  getIcon(): string {
    return "calendar-with-checkmark";
  }

  onClose(): Promise<void> {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  async onOpen(): Promise<void> {
    // Integration point: external plugins can listen for `calendar:open`
    // to feed in additional sources.
    const sources = [
      customTagsSource,
      streakSource,
      wordCountSource,
      tasksSource,
    ];
    this.app.workspace.trigger(TRIGGER_ON_OPEN, sources);

    this.calendar = new Calendar({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (this as any).contentEl,
      props: {
        onClickDay: this.openOrCreateDailyNote,
        onClickWeek: this.openOrCreateWeeklyNote,
        onClickMonth: this.openOrCreateMonthlyNote,
        onClickYear: this.openOrCreateYearlyNote,
        onClickQuarter: this.openOrCreateQuarterlyNote,
        onHoverDay: this.onHoverDay,
        onHoverWeek: this.onHoverWeek,
        onHoverMonth: this.onHoverMonth,
        onHoverYear: this.onHoverYear,
        onHoverQuarter: this.onHoverQuarter,
        onContextMenuDay: this.onContextMenuDay,
        onContextMenuWeek: this.onContextMenuWeek,
        onContextMenuMonth: this.onContextMenuMonth,
        onContextMenuYear: this.onContextMenuYear,
        onContextMenuQuarter: this.onContextMenuQuarter,
        onSetMode: this.setCalendarMode,
        onClickJalali: this.openOrCreateJalaliNote,
        onHoverJalali: this.onHoverJalali,
        onContextMenuJalali: this.onContextMenuJalali,
        sources,
      },
    });
  }

  openOrCreateJalaliNote(
    period: JalaliPeriod,
    date: Date,
    ctrlPressed: boolean
  ): Promise<void> {
    return openOrCreateJalaliNote(
      this.settings,
      period,
      date,
      ctrlPressed,
      (file) => activeFilePath.set(file.path)
    );
  }

  private onHoverJalali(
    period: JalaliPeriod,
    date: Date,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const { format } = getJalaliNoteConfig(this.settings, period);
    const note = getJalaliNote(this.settings, period, date);
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      formatJalali(startOfJalaliPeriod(date, period), format),
      note?.path
    );
  }

  private onContextMenuJalali(
    period: JalaliPeriod,
    date: Date,
    event: MouseEvent
  ): void {
    const note = getJalaliNote(this.settings, period, date);
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onJalaliNotesChanged(): void {
    if (this.settings?.calendarMode === "jalali") {
      jalaliRevision.update((n) => n + 1);
    }
  }

  onHoverDay(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const { format } = getDailyNoteSettings();
    const note = getDailyNote(date, get(dailyNotes));
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverWeek(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const note = getWeeklyNote(date, get(weeklyNotes));
    const { format } = getWeeklyNoteSettings();
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverMonth(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const note = getMonthlyNote(date, get(monthlyNotes));
    const { format } = getMonthlyNoteSettings();
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverYear(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const note = getYearlyNote(date, get(yearlyNotes));
    const { format } = getYearlyNoteSettings();
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverQuarter(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const { format } = getQuarterlyNoteSettings();
    const note = getQuarterlyNote(date, get(quarterlyNotes));
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  private onContextMenuDay(date: Moment, event: MouseEvent): void {
    const note = getDailyNote(date, get(dailyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuWeek(date: Moment, event: MouseEvent): void {
    const note = getWeeklyNote(date, get(weeklyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuMonth(date: Moment, event: MouseEvent): void {
    const note = getMonthlyNote(date, get(monthlyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuYear(date: Moment, event: MouseEvent): void {
    const note = getYearlyNote(date, get(yearlyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuQuarter(date: Moment, event: MouseEvent): void {
    const note = getQuarterlyNote(date, get(quarterlyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onNoteSettingsUpdate(): void {
    dailyNotes.reindex();
    weeklyNotes.reindex();
    monthlyNotes.reindex();
    quarterlyNotes.reindex(); // Added line
    yearlyNotes.reindex();
    this.updateActiveFile();
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    if (getDateFromFile(file, "day")) {
      dailyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "week")) {
      weeklyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "month")) {
      monthlyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "quarter")) {
      // Added block
      quarterlyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "year")) {
      yearlyNotes.reindex();
      this.updateActiveFile();
    }
  }

  private async onFileModified(file: TFile): Promise<void> {
    const date =
      getDateFromFile(file, "day") ||
      getDateFromFile(file, "week") ||
      getDateFromFile(file, "month") ||
      getDateFromFile(file, "quarter") || // Added line
      getDateFromFile(file, "year");
    if (date && this.calendar) {
      this.calendar.tick();
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady && this.calendar) {
      if (getDateFromFile(file, "day")) {
        dailyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "week")) {
        weeklyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "month")) {
        monthlyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "quarter")) {
        // Added block
        quarterlyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "year")) {
        yearlyNotes.reindex();
        this.calendar.tick();
      }
    }
  }

  public onFileOpen(_file: TFile): void {
    if (this.app.workspace.layoutReady) {
      this.updateActiveFile();
    }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    activeFile.setFile(file);
    activeFilePath.set(file ? file.path : null);

    if (this.calendar) {
      this.calendar.tick();
    }
  }

  public revealActiveNote(): void {
    const { activeLeaf } = this.app.workspace;
    if (!(activeLeaf.view instanceof FileView)) {
      return;
    }
    const file = activeLeaf.view.file;

    // Prefer reading the note as the calendar being shown, then the other one.
    const inJalali = this.settings.calendarMode === "jalali";
    const date = inJalali
      ? this.findJalaliDate(file) ?? this.findGregorianDate(file)
      : this.findGregorianDate(file) ?? this.findJalaliDate(file);
    if (!date) {
      return;
    }

    if (inJalali) {
      this.calendar.$set({ jalaliDisplayed: date.toDate() });
    } else {
      this.calendar.$set({ displayedMonth: date });
    }
  }

  private findJalaliDate(file: TFile): Moment | null {
    const date = findJalaliDateForFile(this.settings, file);
    return date ? window.moment(date) : null;
  }

  private findGregorianDate(file: TFile): Moment | null {
    const { moment } = window;

    const day = getDateFromFile(file, "day");
    if (day) {
      return day;
    }

    const formats = [
      getWeeklyNoteSettings().format,
      getMonthlyNoteSettings().format,
      getQuarterlyNoteSettings().format,
      getYearlyNoteSettings().format,
    ];
    for (const format of formats) {
      const date = moment(file.basename, format, true);
      if (date.isValid()) {
        return date;
      }
    }
    return null;
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    ctrlPressed: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfWeek = date.clone().startOf("week");

    const existingFile = getWeeklyNote(date, get(weeklyNotes));

    if (!existingFile) {
      tryToCreateWeeklyNote(startOfWeek, ctrlPressed, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    let leaf: WorkspaceLeaf;
    if (ctrlPressed) {
      if (this.settings.ctrlClickOpensInNewTab) {
        leaf = workspace.getLeaf("tab");
      } else {
        leaf = workspace.getLeaf("split", "vertical");
      }
    } else {
      leaf = workspace.getLeaf(false);
    }
    await leaf.openFile(existingFile);
  }

  async openOrCreateDailyNote(
    date: Moment,
    ctrlPressed: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    const existingFile = getDailyNote(date, get(dailyNotes));
    if (!existingFile) {
      tryToCreateDailyNote(
        date,
        ctrlPressed,
        this.settings,
        (dailyNote: TFile) => {
          activeFile.setFile(dailyNote);
        }
      );
      return;
    }

    let leaf: WorkspaceLeaf;
    if (ctrlPressed) {
      if (this.settings.ctrlClickOpensInNewTab) {
        leaf = workspace.getLeaf("tab");
      } else {
        leaf = workspace.getLeaf("split", "vertical");
      }
    } else {
      leaf = workspace.getLeaf(false);
    }
    await leaf.openFile(existingFile);
  }

  async openOrCreateMonthlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfMonth = date.clone().startOf("month");

    const existingFile = getMonthlyNote(date, get(monthlyNotes));
    if (!existingFile) {
      tryToCreateMonthlyNote(
        startOfMonth,
        inNewSplit,
        this.settings,
        (file) => {
          activeFile.setFile(file);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }

  async openOrCreateQuarterlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfQuarter = date.clone().startOf("quarter");

    const existingFile = getQuarterlyNote(date, get(quarterlyNotes));

    if (!existingFile) {
      tryToCreateQuarterlyNote(
        startOfQuarter,
        inNewSplit,
        this.settings,
        (file) => {
          activeFile.setFile(file);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }

  async openOrCreateYearlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfYear = date.clone().startOf("year");

    const existingFile = getYearlyNote(date, get(yearlyNotes));

    if (!existingFile) {
      tryToCreateYearlyNote(startOfYear, inNewSplit, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }
}
