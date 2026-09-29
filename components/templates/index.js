import Template1 from './Template1';
import Template2 from './Template2';
import SidebarTemplate from './SidebarTemplate';
import ModernTemplate from './ModernTemplate';
import ExecutiveSplitTemplate from './ExecutiveSplitTemplate';

export { Template1, Template2, SidebarTemplate, ModernTemplate, ExecutiveSplitTemplate };
export * from './common';

export const TEMPLATES_MAP = {
  template1: Template1,
  classic: Template1,
  template2: Template2,
  executive: Template2,
  sidebar: SidebarTemplate,
  split: SidebarTemplate,
  modern: ModernTemplate,
  charcoal: SidebarTemplate,
  navy: SidebarTemplate,
  premium: ExecutiveSplitTemplate,
  'executive-split': ExecutiveSplitTemplate,
  'executive_split': ExecutiveSplitTemplate,
  emerald: SidebarTemplate,
};

export function getTemplateComponent(name) {
  if (!name) return Template1;
  const key = String(name).toLowerCase().trim();
  return TEMPLATES_MAP[key] || Template1;
}

export default {
  Template1,
  Template2,
  SidebarTemplate,
  ModernTemplate,
  ExecutiveSplitTemplate,
  getTemplateComponent,
};
