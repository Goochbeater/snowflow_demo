// ===== 98-tests: core self-tests (?test)  (OWNER: coordinator; agents add AF.test() calls in their own parts) =====
AF.test('no part or build stage threw', () => ({ ok: AF.errors.length === 0, info: AF.errors.map((e) => e.part + ': ' + e.msg.split('\n')[0]).join(' | ') }));
AF.test('world meshed with geometry', () => ({ ok: (AF.stats && AF.stats.quads > 200), info: 'quads ' + (AF.stats && AF.stats.quads) }));
AF.test('palette under capacity', () => ({ ok: AF.PAL.n < 4000, info: 'colours ' + AF.PAL.n }));
AF.test('a mode is active', () => ({ ok: !!AF.mode, info: String(AF.mode) }));
AF.test('boot under 25 s', () => ({ ok: AF.bootMs < 25000, info: AF.bootMs + ' ms ' + JSON.stringify(AF.stageTimes) }));
AF.test('ground at spawn is walkable', () => { const s = AF.PLAN.spawn; const y = AF.surfaceBelow(s.x, s.z, 40); return { ok: y > -1 && y < 3, info: 'y=' + y }; });

// ---- core destruction tests (they wreck a patch of the west fields at (-250, 60), far from the city)
AF.test('blast carves voxels and re-meshes', () => { const W = AF.W, K = AF.DK; W.fill(-254, 12, 56, -246, 20, 64, K.wall); W.flush(); const n = AF.boom(-250, 16, 60, { r: 3, silent: true }); W.flush(); return { ok: n > 500 && W.getM(-250, 16, 60) === 0, info: 'removed ' + n }; });
AF.test('what loses its footing falls', () => { const W = AF.W, K = AF.DK; W.fill(-270, 20, 56, -266, 24, 60, K.wall); W.flush(); AF.struct.check(-272, 18, 54, -264, 26, 62, 0); AF.stepSim(40, 1 / 30); return { ok: W.getM(-268, 22, 58) === 0, info: 'pieces ' + AF.stats.pieces + ' fallen ' + AF.struct.fallen }; });
AF.test('thatch catches and burns', () => { const W = AF.W, K = AF.K, g = W.groundY(-280, 60); W.fill(-284, g, 56, -276, g + 3, 64, K.thatch); W.flush(); const lit = AF.ignite(-280, g + 1.5, 60, 2, 3); AF.stepSim(200, 1 / 30); return { ok: lit > 20 && AF.fire.total > 5, info: 'lit ' + lit + ' burning ' + AF.fire.count + ' burnt ' + AF.fire.total }; });
AF.test('stone does not burn', () => { const W = AF.W, K = AF.K, g = W.groundY(-280, 80); W.fill(-282, g, 78, -278, g + 3, 82, K.wall); const lit = AF.ignite(-280, g + 1.5, 80, 2, 3); return { ok: lit === 0, info: 'lit ' + lit }; });
