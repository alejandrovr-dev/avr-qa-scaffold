/**
 * @module src/ports/output/templateRepositoryPort.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Interface for template repository operations
 * Defines the contract that any template repository adapter must respect
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-19
 * @lastModified 2025-05-19
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

/**
 * Contract definition
 * @typedef {Object} TemplateRepositoryPort
 * @property {function(string, string): Promise<string>} getTemplate - Get template content by type and name
 * @property {function(string): Promise<string[]>} listTemplates - List available templates for a project type
 * @property {function(): Promise<string[]>} listProjectTypes - List all available project types
 * @property {function(string): Promise<boolean>} hasTemplatesForType - Check if templates exist for a project type
 */

/**
 * Validates that an object implements the TemplateRepositoryPort interface
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if the object implements TemplateRepositoryPort
 */
export function isTemplateRepository(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.getTemplate === 'function' &&
    typeof obj.listTemplates === 'function' &&
    typeof obj.listProjectTypes === 'function' &&
    typeof obj.hasTemplatesForType === 'function'
  );
}

/**
 * Creates a null template repository that returns default values
 * @returns {TemplateRepositoryPort} A template repository that does nothing
 */
export function createNullTemplateRepository() {
  return {
    getTemplate: async () => '',
    listTemplates: async () => [],
    listProjectTypes: async () => [],
    hasTemplatesForType: async () => false,
  };
}