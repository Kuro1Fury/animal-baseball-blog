# @export 与资源系统

> `@export` 让变量在编辑器里可见可调；Resource 是 Godot 的数据对象系统。

## @export 是什么

在变量前加 `@export`，这个变量就会出现在 Godot 编辑器的 **Inspector 面板**里，可以在不修改代码的情况下实时改值：

```gdscript
@export var pitch_duration: float = 1.5
@export var auto_catch:     bool  = true
@export var throw_speed:    float = 600.0
```

Inspector 面板里会看到：

```
BallController
├── Pitch Duration     [1.5]
└── Auto Catch         [✓]
```

**对 Java 开发者的类比**：

```java
// Spring 的外部化配置
@Value("${pitch.duration:1.5}")
private double pitchDuration;
```

两者的目的相同：把可调参数从代码里分离出来，不用改代码就能调整行为。区别在于 `@export` 是"给游戏设计师调参"，`@Value` 是"给运维配置环境"。

## @export 的类型支持

```gdscript
@export var speed: float = 100.0       # 数字输入框
@export var enabled: bool = true       # 复选框
@export var label_text: String = "Hi"  # 文本输入框
@export var color: Color = Color.RED   # 颜色选择器
@export var sprite: Texture2D          # 资源拖拽槽（可以拖入图片）
@export var target: NodePath           # 节点路径选择器
```

Godot 根据类型自动选择合适的 UI 控件。

## 两种写法

```gdscript
@export var pitch_duration: float = 1.5   # 显式类型注解（推荐）
@export var auto_catch := true            # 类型推断（推断为 bool）
```

## 典型工作流：调参 → 固化

Godot 开发的常见节奏是：

1. 先把参数加 `@export`
2. 在编辑器里运行游戏，实时拖拽调整
3. 找到满意的数值
4. 把数值写回代码作为默认值

项目里 commit `4d7c8c5` / `13f8572` 叫"调参完成"，就是这个过程的产物——在 Inspector 里反复试验后，把最终数值固化为代码默认值。

## @export 和 const 的选择

```gdscript
@export var pitch_duration: float = 1.5   # 经常调整的参数
const GRAVITY := 200.0                    # 物理常量，不应该变
const GROUND_BALL_HEIGHT_THRESHOLD := 3.0 # 物理约定，不需要调整
```

**经验**：不确定时先用 `@export`，确定不需要调整再改成 `const`。

## 集中式参数 vs @export：两种方案

项目里出现了两种参数管理方式：

### 方案 A：`@export`（`BallController`）

```gdscript
# ball_controller.gd
@export var pitch_duration: float = 1.5
@export var pitch_peak_z:   float = 100.0
```

优点：每个实例可以独立配置（不同的球可以有不同参数）。

### 方案 B：静态字典（`AnimalParams`）

```gdscript
# animal_params.gd
const PARAMS := {
    "monkey": {"move_speed": 150.0, "catch_h_radius": 55.0},
    "eagle":  {"move_speed": 130.0, "catch_h_radius": 45.0},
}
```

优点：多个实例共享同一份数据，一处修改全局生效。  
代价：Inspector 里看不到，改数值要改代码。

**什么时候用哪种**：
- 每个实例参数可能不同 → `@export`
- 按类型分类、多个实例共享 → 静态字典

## Resource（资源）简介

`Resource` 是 Godot 的数据对象基类，`.tres` 文件格式。常见内置资源：

| 资源类型 | 用途 |
|----------|------|
| `Texture2D` | 图片（PNG/JPG） |
| `AudioStream` | 音频文件 |
| `PackedScene` | 场景文件（`.tscn`） |
| `Font` | 字体 |
| `ShaderMaterial` | 着色器材质 |

资源可以通过 `@export` 在 Inspector 里拖拽赋值：

```gdscript
@export var sprite_texture: Texture2D  # 直接拖入图片文件
```

也可以用代码动态加载：

```gdscript
# animal_controller.gd
var path := "res://assets/sprites/animals/%s/%s_idle.png" % [folder, folder]
if ResourceLoader.exists(path):
    $Sprite2D.texture = load(path)  # 运行时加载图片
```

`res://` 是 Godot 的虚拟路径前缀，指向项目资源根目录——类似 Java 里的 `classpath:`。

`ResourceLoader.exists(path)` 在加载前先检查文件是否存在，避免因为素材缺失而报错崩溃。

## 音频资源的加载（项目示例）

```gdscript
# game_director.gd _init_sfx()
func _init_sfx() -> void:
    var names := ["swing", "hit", "catch", "miss", "out"]
    for key in names:
        for ext in ["ogg", "wav"]:
            var candidate := "res://assets/audio/sfx/sfx_%s.%s" % [key, ext]
            if ResourceLoader.exists(candidate):
                var player := AudioStreamPlayer.new()  # 动态创建节点
                player.stream = load(candidate)         # 加载音频资源
                add_child(player)                       # 加入场景树
                _sfx[key] = player                      # 存字典备用
                break
```

这段代码动态创建 `AudioStreamPlayer` 节点并加载音频，对应 Java 里的"运行时动态注册 Bean"。

## 在项目里找这些内容

- `ball_controller.gd`:11-18 — `@export` 参数声明
- `game_director.gd`:3-6 — GameDirector 的 `@export` 参数
- `animal_params.gd`:4-10 — 静态字典方案（对比 `@export`）
- `animal_controller.gd`:39-46 — 运行时加载图片资源
- `game_director.gd`:121-136 — 运行时加载音频资源
