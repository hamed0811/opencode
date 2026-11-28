'use strict';

const skills = new Map();

function validateSkill(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new TypeError('skill_manifest_required');
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(manifest.id || '')) throw new TypeError('invalid_skill_id');
  for (const field of ['name', 'description', 'instructions']) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) throw new TypeError(`skill_${field}_required`);
  }
  if (manifest.instructions.length > 30000) throw new TypeError('skill_instructions_too_long');
  if (manifest.capabilities !== undefined &&
      (!Array.isArray(manifest.capabilities) || manifest.capabilities.some(item => typeof item !== 'string' || !/^[a-z][a-z0-9:_-]{1,63}$/.test(item)))) {
    throw new TypeError('invalid_skill_capabilities');
  }
}

function registerSkill(manifest) {
  validateSkill(manifest);
  if (skills.has(manifest.id)) throw new Error('skill_already_registered');
  const skill = Object.freeze({
    id: manifest.id,
    name: manifest.name.trim(),
    description: manifest.description.trim(),
    instructions: manifest.instructions,
    capabilities: Object.freeze([...(manifest.capabilities || [])])
  });
  skills.set(skill.id, skill);
  return skill;
}

function getSkill(id) { return skills.get(id) || null; }
function listSkills() { return [...skills.values()].map(skill => ({ ...skill, capabilities: [...skill.capabilities] })); }
function clearSkills() { skills.clear(); }

module.exports = { validateSkill, registerSkill, getSkill, listSkills, clearSkills };
