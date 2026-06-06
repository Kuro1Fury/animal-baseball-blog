---
layout: home

hero:
  name: Animal Baseball
  text: 动物棒球开发日志
  tagline: 一个 Godot 2D 棒球游戏的开发记录与学习笔记
  actions:
    - theme: brand
      text: 查看时间线
      link: /timeline/
    - theme: alt
      text: 开始阅读代码
      link: /code-reading/ball_controller


features:
  - title: 开发日志
    details: 按日期记录项目从零开始的进展，每篇对应真实 commit 阶段。
    link: /devlog/2026-05-28-init
  - title: 代码阅读指南
    details: 按文件组织的阅读指南，告诉你先看哪里、能学到什么。
    link: /code-reading/ball_controller
  - title: Godot 基础（独立成体系）
    details: 从 Java 开发者视角系统学习 Godot，覆盖 Node/Scene/信号/物理/输入等核心概念。
    link: /godot-basics/scene-and-node
  - title: 项目视角笔记
    details: 从项目真实代码提炼的 Godot 用法，对应具体的实现决策。
    link: /godot-notes/z-height-simulation
---

## 当前项目状态

> 最后同步：2026-06-07（commit `28658e7`）

| 系统 | 状态 |
|------|------|
| 投球 + 物理弧线 | ✅ 完成 |
| 挥棒判定（Perfect / Good / Early / Late / Miss）| ✅ 完成 |
| 球的 z 高度模拟（飞球 / 地滚球）| ✅ 完成 |
| 动物守备系统（5 种动物）| ✅ 完成 |
| 接球椭圆判定区 | ✅ 完成 |
| 传球（守备员到守备员）| ✅ 完成 |
| Hold-and-Stamp（持球走到垒踩垒）| ✅ 完成 |
| Numpad 守备编号传球（1-9）| ✅ 完成 |
| 跑垒（击球者跑一垒）| ✅ 完成 |
| Force Out（封杀出局）| ✅ 完成 |
| Strike / Out 计数 + 半局结束 | ✅ 完成 |
| 垒位占用状态（1B / 2B）| ✅ 完成 |
| 一垒→二垒推进原型 | 🔧 MVP（无回垒规则）|
| 训练场景（F10 菜单）| ✅ 完成 |
| 调试可视化（F1-F5）| ✅ 完成 |

## 两条并行轨道

本博客内容分两类，可以独立阅读也可以交叉：

### 轨道 A：Godot 基础（给零基础 Godot 的 Java 开发者）

适合先读这条轨道，建立对 Godot 概念的正确认知。共 19 篇，分 4 组：

**核心概念（必读）**
1. **[Scene 与 Node](/godot-basics/scene-and-node)** — 基本单元，类比 Spring Bean / ApplicationContext
2. **[GDScript 速览](/godot-basics/gdscript-for-java)** — 语法对照表，Java 开发者 30 分钟上手
3. **[GDScript 进阶](/godot-basics/gdscript-advanced)** — await / Callable / Lambda / preload
4. **[节点生命周期](/godot-basics/node-lifecycle)** — `_ready` / `_process` / `_physics_process` 的分工
5. **[场景树与节点引用](/godot-basics/scene-tree-references)** — `$`、`@onready`，类比 @Autowired
6. **[Autoload / 全局单例](/godot-basics/autoload)** — 全局服务，类比 Spring @Service

**交互与逻辑**

7. **[信号系统](/godot-basics/signals)** — Godot 的 EventBus / Observer 模式
8. **[输入系统](/godot-basics/input-system)** — Input Map 与事件处理
9. **[枚举状态机](/godot-basics/state-machine)** — 游戏里最常用的设计模式
10. **[Timer](/godot-basics/timer)** — 节点 vs float 变量，两种倒计时方案
11. **[@export 与资源系统](/godot-basics/export-and-resources)** — 参数外化与资源加载

**物理与渲染**

12. **[物理节点](/godot-basics/physics-bodies)** — CharacterBody2D 与 move_and_slide
13. **[CollisionShape2D 与碰撞层](/godot-basics/collision)** — 碰撞形状与 Layer/Mask 系统
14. **[Area2D](/godot-basics/area2d)** — 感知区域，不产生阻挡
15. **[Camera2D 与视口](/godot-basics/camera2d)** — 控制玩家看到的世界范围
16. **[Tween 动画](/godot-basics/tween)** — 属性插值动画，一行代码做过渡效果
17. **[Control 节点与 UI 系统](/godot-basics/control-and-ui)** — 按钮/标签/布局容器

**进阶技巧**

18. **[动态节点创建](/godot-basics/dynamic-nodes)** — new() / add_child() / queue_free()
19. **[调试工具](/godot-basics/debugging)** — assert、Remote 场景树、Profiler

### 轨道 B：项目深潜（结合真实 commit 和代码）

了解了基础后，可以直接进入项目：

1. **[项目时间线](/timeline/)** — 5 分钟了解项目演进历史
2. **[z 高度模拟](/godot-notes/z-height-simulation)** — 整个物理系统的核心设计
3. **[ball_controller.gd](/code-reading/ball_controller)** — 球的状态机，逻辑与视觉分离
4. **[击球判定系统](/code-reading/batting_controller)** — 时机窗口的数学逻辑
5. **[game_director.gd](/code-reading/game_director)** — 游戏总控：信号 + 状态机的综合运用

## 最近进展（2026-06-07）

- `28658e7` 训练场景菜单（F10）：可设置 Strike/Out 数和垒位状态
- `8f6aae1` 实现一垒→二垒推进原型（MVP，不含回垒逻辑）
- `aab5bf7` Throw UX Polish：持球时动态显示可传球目标列表
- `a50797b` Numpad 1-9 按守备编号传球，控制权自动转移到接球者
