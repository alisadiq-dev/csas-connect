export type NavIconName =
  | "dashboard"
  | "attendance"
  | "results"
  | "timetable"
  | "notices"
  | "programs"
  | "batches"
  | "courses"
  | "offerings"
  | "teachers"
  | "students"
  | "feed";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Shown as a tab in the mobile bottom bar (everything else lives under "More"). Defaults to the first four items. */
  primary?: boolean;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};
