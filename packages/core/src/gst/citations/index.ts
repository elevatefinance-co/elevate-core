/* Barrel re-export for the gst citation registry. The four sub-registries cover the most-cited primary
 * sources for the GST regime: CGST Act sections, IGST Act sections, CGST Rules, and operative CBIC
 * notifications. State GST Act citations project from the CGST registry by swapping the act discriminator
 * (the Sections are intentionally aligned across the State GST Acts and the CGST Act). */

export * from './cgst-act-sections.js';
export * from './igst-act-sections.js';
export * from './cgst-rules.js';
export * from './cbic-notifications.js';
