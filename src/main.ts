import type { Moment, WeekSpec } from "moment";
import { App, Notice, Plugin, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "./constants";
import { openOrCreateJalaliNote } from "./io/jalali/notes";
import { parseCalendarUri } from "./io/jalali/uri";
import type { JalaliPeriod } from "./jalali/dates";
import { settings } from "./ui/stores";
import {
  appHasPeriodicNotesPluginLoaded,
  CalendarSettingsTab,
  ISettings,
} from "./settings";
import CalendarView from "./view";
import { ConvertDateModal } from "./ui/convertModal";
import PlaceholderSuggest from "./ui/placeholderSuggest";
import ReferenceSuggest from "./ui/referenceSuggest";

declare global {
  interface Window {
    app: App;
    moment: () => Moment;
    _bundledLocaleWeekSpec: WeekSpec;
  }
}

export default class CalendarPlugin extends Plugin {
  public options: ISettings;
  private view: CalendarView;

  onunload(): void {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_CALENDAR)
      .forEach((leaf) => leaf.detach());
  }

  async onload(): Promise<void> {
    this.register(
      settings.subscribe((value) => {
        this.options = value;
      })
    );

    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf: WorkspaceLeaf) =>
        (this.view = new CalendarView(leaf, (calendarMode) =>
          this.writeOptions(() => ({ calendarMode }))
        ))
    );

    this.addCommand({
      id: "toggle-calendar-mode",
      name: "Toggle Jalali/Gregorian calendar",
      callback: () =>
        this.writeOptions((old) => ({
          calendarMode: old.calendarMode === "jalali" ? "gregorian" : "jalali",
        })),
    });

    this.addCommand({
      id: "show-calendar-view",
      name: "Open view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return (
            this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length === 0
          );
        }
        this.initLeaf();
      },
    });

    this.addCommand({
      id: "convert-date",
      name: "Convert date between Jalali and Gregorian",
      callback: () =>
        new ConvertDateModal(this.app, this.options.calendarMode).open(),
    });

    this.addCommand({
      id: "open-weekly-note",
      name: "Open Weekly Note",
      checkCallback: (checking) => {
        if (this.options.calendarMode === "jalali") {
          if (!checking) {
            this.openTodaysJalaliNote("week");
          }
          return true;
        }
        if (checking) {
          return !appHasPeriodicNotesPluginLoaded();
        }
        this.view.openOrCreateWeeklyNote(window.moment(), false);
      },
    });

    const jalaliCommands: [string, string, JalaliPeriod][] = [
      ["open-daily-note", "Open Daily Note", "day"],
      ["open-monthly-note", "Open Monthly Note", "month"],
      ["open-quarterly-note", "Open Quarterly Note", "quarter"],
      ["open-yearly-note", "Open Yearly Note", "year"],
    ];
    jalaliCommands.forEach(([id, name, period]) =>
      this.addCommand({
        id,
        name,
        checkCallback: (checking) => {
          if (this.options.calendarMode !== "jalali") {
            return false;
          }
          if (!checking) {
            this.openTodaysJalaliNote(period);
          }
          return true;
        },
      })
    );

    this.registerObsidianProtocolHandler("persian-calendar", (params) => {
      const result = parseCalendarUri(params, new Date());
      if ("error" in result) {
        new Notice(result.error);
        return;
      }
      // An external caller can't answer the confirm-before-create dialog.
      openOrCreateJalaliNote(
        { ...this.options, shouldConfirmBeforeCreate: false },
        result.period,
        result.date,
        false
      );
    });

    this.addCommand({
      id: "reveal-active-note",
      name: "Reveal active note",
      callback: () => this.view.revealActiveNote(),
    });

    this.registerEditorSuggest(
      new ReferenceSuggest(this.app, () => this.options)
    );
    this.registerEditorSuggest(
      new PlaceholderSuggest(this.app, () => this.options)
    );

    await this.loadOptions();

    this.addSettingTab(new CalendarSettingsTab(this.app, this));

    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.registerEvent(
        this.app.workspace.on("layout-ready", this.initLeaf.bind(this))
      );
    }
  }

  private openTodaysJalaliNote(period: JalaliPeriod): void {
    openOrCreateJalaliNote(this.options, period, new Date(), false);
  }

  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }

  async loadOptions(): Promise<void> {
    const options = await this.loadData();
    settings.update((old) => {
      return {
        ...old,
        ...(options || {}),
      };
    });

    await this.saveData(this.options);
  }

  async writeOptions(
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ): Promise<void> {
    settings.update((old) => ({ ...old, ...changeOpts(old) }));
    await this.saveData(this.options);
  }
}
