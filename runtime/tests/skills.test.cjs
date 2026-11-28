'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const skills = require('../skills/registry.cjs');

test('skill registry validates, registers and lists prompt-only skills', () => {
  skills.clearSkills();
  const skill = skills.registerSkill({ id: 'code-review', name: 'Code Review', description: 'Review code safely', instructions: 'Inspect changes and report risks.', capabilities: ['read:repository'] });
  assert.equal(skills.getSkill('code-review').name, 'Code Review');
  assert.deepEqual(skills.listSkills()[0].capabilities, ['read:repository']);
  assert.throws(() => skills.registerSkill({ id: 'code-review', name: 'Duplicate', description: 'x', instructions: 'y' }), /skill_already_registered/);
});

test('skill registry rejects malformed manifests and oversized instructions', () => {
  assert.throws(() => skills.validateSkill({ id: 'bad id', name: 'x', description: 'x', instructions: 'x' }), /invalid_skill_id/);
  assert.throws(() => skills.validateSkill({ id: 'valid-skill', name: 'x', description: 'x', instructions: 'x', capabilities: ['Read Files'] }), /invalid_skill_capabilities/);
  assert.throws(() => skills.validateSkill({ id: 'valid-skill', name: 'x', description: 'x', instructions: 'x'.repeat(30001) }), /skill_instructions_too_long/);
});
