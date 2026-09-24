import Template1 from './Template1';
import Template2 from './Template2';
import SidebarTemplate from './SidebarTemplate';
import ModernTemplate from './ModernTemplate';

export { Template1, Template2, SidebarTemplate, ModernTemplate };
export * from './common';

export const TEMPLATES_MAP = {
  template1: Template1,
  classic: Template1,
  template2: Template2,
  executive: Template2,
  sidebar: SidebarTemplate,
  split: SidebarTemplate,
  modern: ModernTemplate,
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
  getTemplateComponent,
};
