# Autoload / 全局单例

> Autoload 是 Godot 的全局服务机制——在任何场景、任何脚本里都能直接访问的单例。

## 什么是 Autoload

普通节点只在它所在的场景里有效，场景切换后就被销毁。**Autoload** 是一类特殊节点：

- 在游戏启动时自动创建
- 在整个游戏生命周期内持续存在（不随场景切换销毁）
- 任何脚本都可以通过名字直接访问

**对 Java 开发者的类比**：Autoload ≈ Spring `@Service` 单例 Bean——全局唯一，由容器（引擎）管理生命周期，其他地方直接注入使用。

## 配置方式

在 Godot 编辑器里：`Project → Project Settings → Autoload`

添加一个 `.gd` 脚本或 `.tscn` 场景，给它一个名字（如 `GameManager`），Godot 会在启动时自动实例化它并挂到场景树根节点下。

## 访问方式

配置好后，任何脚本都可以直接用名字访问：

```gdscript
# 假设配置了名为 "GameManager" 的 Autoload
GameManager.player_score += 10
GameManager.save_game()

# 也可以用 /root/ 绝对路径（更明确但更啰嗦）
get_node("/root/GameManager").player_score += 10
```

不需要 import，不需要 `@onready`，直接用名字——因为 Autoload 节点在所有其他节点的父节点处（场景树根节点下）。

## 典型用途

### 1. 全局游戏状态

```gdscript
# game_manager.gd（Autoload，名字 "GameManager"）
extends Node

var total_score:  int  = 0
var high_score:   int  = 0
var current_level: int = 1

func add_score(points: int) -> void:
    total_score += points
    if total_score > high_score:
        high_score = total_score
```

任何场景里：

```gdscript
GameManager.add_score(100)
print(GameManager.total_score)
```

### 2. 全局事件总线（Event Bus）

把信号定义在 Autoload 里，实现全局广播：

```gdscript
# event_bus.gd（Autoload，名字 "EventBus"）
extends Node

signal game_over
signal score_changed(new_score: int)
signal scene_transition_requested(scene_path: String)
```

发送事件（任何地方）：

```gdscript
EventBus.game_over.emit()
EventBus.score_changed.emit(100)
```

监听事件（任何地方）：

```gdscript
func _ready() -> void:
    EventBus.game_over.connect(_on_game_over)
```

**对 Java 开发者的类比**：这就是 Spring 的 `ApplicationEventPublisher` + `@EventListener` 模式，只是换成了 Godot 信号。

### 3. 数据持久化（存档）

```gdscript
# save_manager.gd（Autoload）
extends Node

const SAVE_PATH := "user://save_data.json"

func save(data: Dictionary) -> void:
    var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    file.store_string(JSON.stringify(data))

func load_save() -> Dictionary:
    if not FileAccess.exists(SAVE_PATH):
        return {}
    var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
    return JSON.parse_string(file.get_as_text())
```

### 4. 音频管理器

```gdscript
# audio_manager.gd（Autoload）
extends Node

func play_sfx(name: String) -> void: ...
func play_music(path: String) -> void: ...
func set_master_volume(value: float) -> void: ...
```

## Animal Baseball 里的情况

这个项目**没有使用 Autoload**——所有状态都在 `GameDirector` 里管理，场景也只有一个。

这是合理的：单场景、规模较小的游戏不需要 Autoload。但如果项目扩展到多个场景（比赛场景、主菜单、成绩页面），就需要 Autoload 来跨场景传递数据了。

## 什么时候用 Autoload？

| 场景 | 推荐方式 |
|------|---------|
| 状态只在当前场景用 | 普通节点变量 |
| 状态需要跨场景保持 | Autoload |
| 需要全局事件总线 | Autoload（Event Bus 模式）|
| 音频、存档、设置管理 | Autoload |
| 调试工具、性能监控 | Autoload |

## Autoload 的注意事项

**1. 不要滥用**：Autoload 是全局状态，过度使用会导致代码难以测试和维护——和 Spring 里滥用 `@Autowired` 到处注入 `ApplicationContext` 一样的问题。

**2. 循环依赖**：两个 Autoload 互相依赖时，初始化顺序可能导致问题（在 Project Settings 里调整 Autoload 的顺序）。

**3. 测试困难**：全局状态难以在单元测试中隔离。Godot 没有内置的 mock 框架，测试 Autoload 需要特殊处理。

## 和 static 变量的区别

GDScript 支持 `static` 变量作为类级别的状态：

```gdscript
# some_class.gd
class_name SomeClass

static var instance_count: int = 0

func _ready() -> void:
    instance_count += 1
```

`static` 变量不需要 Autoload，但：
- 没有 `_ready()`、`_process()` 等生命周期回调
- 不是场景树节点，不能发射/接收信号
- 适合简单计数、缓存，不适合复杂的游戏系统

`AnimalParams.PARAMS` 就是用 `const`（类静态常量）存储共享数据的例子——它不需要生命周期管理，`const` 足够了。
