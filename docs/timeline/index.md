# 项目时间线

> 基于 `git log` 真实 commit 记录整理。所有日期均来自 git 历史，不做推断。

## Phase 0 — 项目启动（2026-05-28）

| Commit | 内容 |
|--------|------|
| `cdb3636` | Initial Godot project structure |
| `e85236f` | 项目初期计划文档 |

项目从零开始，创建 Godot 项目骨架和初期规划文档。尚无任何游戏逻辑。

---

## Phase 1 — 基础交互（2026-05-29 Week 2-3）

| Commit | 内容 |
|--------|------|
| `f91040b` | 实现可移动像素点（最早的 CharacterBody2D 移动原型）|
| `b6ea68a` | week2 逻辑，实现基础投球 |
| `3d1dc5d` | 完成 week3，实现挥棒 |
| `24fa838` | week3 日志 |
| `822f886` | 动物澄清 |

这一阶段确立了核心循环：**投球 → 挥棒 → 判定**。BattingController 的时间窗判定逻辑在此阶段成形。

---

## Phase 2 — 球的物理与地滚球（2026-05-29 Week 4）

| Commit | 内容 |
|--------|------|
| `fb5b903` | week4 初版 |
| `0f9167c` | 地滚球逻辑 |
| `bec3736` | 地滚修复和最低 z 设定 |

引入 **z 高度变量** 模拟 2D 游戏中的立体高度，BallController 的 `GROUND_BALL_HEIGHT_THRESHOLD` 在此出现。飞球与地滚球的转换逻辑建立。

---

## Phase 3 — 动物系统与场地（2026-05-30）

| Commit | 内容 |
|--------|------|
| `2cf3c8e` | 加入 debug 参数 |
| `05209e8` | 动物素材与 debug 参数优化 |
| `fe98c3e` | 载入动物素材 |
| `862fc9b` | 重置按键 |
| `6413f28` | 从 git 移除 assets，加入 .gitignore |
| `22e2b87` | 场地调整 |
| `e74df96` | 守备位置重置 |
| `fb6fe53` | 修复熊的守备问题 |
| `e444c25` | 击球可视化与日志记录 |
| `e6281b4` | 展现层 |
| `4d7c8c5` / `13f8572` | 调参完成 |

AnimalParams 静态参数表（monkey / bear / lizard / eagle / croc）建立，FieldingJudge 椭圆接球判定形成，FieldArt 程序化场地绘制完成。

---

## Phase 4 — 跑垒与强迫出局（2026-05-30 → 2026-06-03）

| Commit | 内容 |
|--------|------|
| `549eccf` | 实现简单跑垒 |
| `56445c2` | 跑垒 polish |
| `d913941` | Add force out to first base |
| `cf92170` | Force Out Readability Pass |
| `d57a5eb` | 1B Carry Mechanic — 一垒手离垒时玩家控制踩垒 |

RunnerController 状态机（IDLE / RUNNING_TO_FIRST / SAFE / OUT）建立，Force Out 判定逻辑接入。

---

## Phase 5 — 计分规则与垒位占用（2026-06-04）

| Commit | 内容 |
|--------|------|
| `90279c6` | Strike / Out Count v0.1 — 三振、出局计数、半局结束 |
| `7665796` | Strike / Out Count — 验证通过，文档补全 |
| `479c879` | At-Bat Readability Pass — HUD Strikes/Outs |
| `544365f` | At-Bat Readability Pass — 验证通过 |
| `94e60b7` | Rule Debt Mapping — 规则技术债盘点（仅文档）|
| `b6fe0f7` | Base Occupancy v0.1 — 一垒占用最小 MVP |
| `1e471e2` | Fix: 禁用 Runner1B 碰撞体，修复跑者被卡 bug |
| `c5187eb` | Base Occupancy Readability Pass |

Strike 计数、Out 计数、半局结束逻辑上线。一垒占用状态（`first_base_occupied`）建立。

---

## Phase 6 — 传球系统（2026-06-05）

| Commit | 内容 |
|--------|------|
| `176545b` | Manual Throw to First v0.1 |
| `83aaacd` | Universal Hold-and-Stamp v0.1 |
| `4af741a` | Fielder-to-Fielder Throw v0.1 |
| `c7b233e` | Fix: Line2D ring 改为静态节点修复圆圈不显示 |
| `90799c6` | Add Claude Code ignore rules |

传球目标从固定一垒扩展为任意守备员（Fielder-to-Fielder），Hold-and-Stamp 流程统一。

---

## Phase 7 — 传球 UX + 二垒推进（2026-06-06）

| Commit | 内容 |
|--------|------|
| `a50797b` | Position-Based Throw Input + Receiver Control v0.1 |
| `aab5bf7` | Throw UX Polish v0.1 — 持球提示动态目标列表、HUD |
| `8f6aae1` | Add first-to-second base advancement prototype |

Numpad 1-9 按守备编号传球，控制权自动转移到接球者。一垒跑者可推进到二垒（MVP 原型）。

---

## 下一步

根据 `94e60b7`（Rule Debt Mapping）的技术债盘点，待实现功能包括：
- 跑垒规则完整化（飞球回垒、强迫推进等）
- 多垒跑垒管理系统
- 得分系统
