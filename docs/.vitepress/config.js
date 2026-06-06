import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Animal Baseball Devlog',
  description: '动物棒球游戏开发日志与 Godot/GDScript 学习笔记',
  lang: 'zh-CN',
  base: '/animal-baseball-blog/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '项目时间线', link: '/timeline/' },
      { text: '开发日志', link: '/devlog/2026-05-28-init' },
      { text: '代码阅读', link: '/code-reading/ball_controller' },
      {
        text: 'Godot 学习',
        items: [
          { text: '· Godot 基础（独立成体系）', link: '/godot-basics/scene-and-node' },
          { text: '· 项目视角笔记', link: '/godot-notes/z-height-simulation' },
        ]
      },
      { text: '术语表', link: '/glossary/' },
    ],
    sidebar: {
      '/timeline/': [
        { text: '项目时间线', link: '/timeline/' }
      ],
      '/devlog/': [
        {
          text: '开发日志',
          items: [
            { text: '2026-05-28 — 项目启动', link: '/devlog/2026-05-28-init' },
            { text: '2026-05-29 — 投球、挥棒、地滚球', link: '/devlog/2026-05-29-core-mechanics' },
            { text: '2026-05-30 — 动物系统、守备、场地、跑垒', link: '/devlog/2026-05-30-animals-fielding' },
            { text: '2026-06-03/04 — Strike/Out、垒位占用', link: '/devlog/2026-06-03-04-rules' },
            { text: '2026-06-05/06 — 传球系统、Numpad、二垒推进', link: '/devlog/2026-06-05-06-throwing' },
            { text: '2026-06-07 — 训练菜单 + 调试控制面板', link: '/devlog/2026-06-07-training-menu' },
          ]
        }
      ],
      '/code-reading/': [
        {
          text: '代码阅读指南',
          items: [
            { text: 'ball_controller.gd — 球物理', link: '/code-reading/ball_controller' },
            { text: 'batting_controller.gd — 击球判定', link: '/code-reading/batting_controller' },
            { text: 'game_director.gd — 游戏总控', link: '/code-reading/game_director' },
            { text: 'fielding_judge.gd — 接球判定', link: '/code-reading/fielding_judge' },
            { text: 'animal_params.gd — 动物参数', link: '/code-reading/animal_params' },
            { text: 'field_art.gd — 场地绘制', link: '/code-reading/field_art' },
          ]
        }
      ],
      '/godot-basics/': [
        {
          text: '核心概念',
          items: [
            { text: 'Scene 与 Node：基本单元', link: '/godot-basics/scene-and-node' },
            { text: 'GDScript 速览（Java 视角）', link: '/godot-basics/gdscript-for-java' },
            { text: 'GDScript 进阶：await / Callable / preload', link: '/godot-basics/gdscript-advanced' },
            { text: '节点生命周期：_ready / _process', link: '/godot-basics/node-lifecycle' },
            { text: '场景树与节点引用：$、@onready', link: '/godot-basics/scene-tree-references' },
            { text: 'Autoload / 全局单例', link: '/godot-basics/autoload' },
          ]
        },
        {
          text: '交互与逻辑',
          items: [
            { text: '信号系统：Godot 的 EventBus', link: '/godot-basics/signals' },
            { text: '输入系统：Input Map', link: '/godot-basics/input-system' },
            { text: '枚举状态机模式', link: '/godot-basics/state-machine' },
            { text: 'Timer：节点 vs float 变量', link: '/godot-basics/timer' },
            { text: '@export 与资源系统', link: '/godot-basics/export-and-resources' },
          ]
        },
        {
          text: '物理与渲染',
          items: [
            { text: '物理节点：CharacterBody2D', link: '/godot-basics/physics-bodies' },
            { text: 'CollisionShape2D 与碰撞层', link: '/godot-basics/collision' },
            { text: 'Area2D：检测区域', link: '/godot-basics/area2d' },
            { text: 'Camera2D 与视口', link: '/godot-basics/camera2d' },
            { text: 'Tween：动画与过渡', link: '/godot-basics/tween' },
            { text: 'Control 节点与 UI 系统', link: '/godot-basics/control-and-ui' },
          ]
        },
        {
          text: '进阶技巧',
          items: [
            { text: '动态节点创建：new / add_child / queue_free', link: '/godot-basics/dynamic-nodes' },
            { text: '调试工具', link: '/godot-basics/debugging' },
          ]
        },
      ],
      '/godot-notes/': [
        {
          text: '项目视角笔记',
          items: [
            { text: '用 z 变量模拟 2D 高度', link: '/godot-notes/z-height-simulation' },
            { text: '@export 与 Inspector 调参', link: '/godot-notes/export-and-inspector' },
            { text: '_process 与 _physics_process', link: '/godot-notes/process-and-physics' },
            { text: 'signal 信号系统', link: '/godot-notes/signals' },
            { text: '2D 坐标系与 Vector2', link: '/godot-notes/2d-coordinate-system' },
            { text: 'Line2D / Polygon2D 程序化绘图', link: '/godot-notes/line2d-polygon2d' },
          ]
        }
      ],
      '/glossary/': [
        { text: '术语表', link: '/glossary/' }
      ],
    },
    socialLinks: [],
    footer: {
      message: '基于真实 commit 历史生成，内容与主项目同步更新'
    }
  }
})
