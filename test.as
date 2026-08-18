package {
    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
    import flash.events.MouseEvent;
    import flash.text.TextField;
    import flash.text.TextFormat;

    [SWF(width="800", height="600", backgroundColor="#111111", frameRate="60")]
    public class ParticlePlaygroundAS3 extends Sprite {

        private var particles:Array = [];
        private var gravity:Number = 0.2;
        private var mouseDown:Boolean = false;
        private var mouseXPos:Number = 0;
        private var mouseYPos:Number = 0;

        private var ui:Sprite;
        private var spawnBtn:Sprite;
        private var clearBtn:Sprite;
        private var gravityLabel:TextField;

        public function ParticlePlaygroundAS3() {
            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;

            setupUI();
            spawn(50);

            addEventListener(Event.ENTER_FRAME, onEnterFrame);
            stage.addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
            stage.addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
            stage.addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
        }

        private function setupUI():void {
            ui = new Sprite();
            addChild(ui);

            spawnBtn = makeButton("Spawn 50");
            spawnBtn.x = 10;
            spawnBtn.y = 10;
            spawnBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
                spawn(50);
            });
            ui.addChild(spawnBtn);

            clearBtn = makeButton("Clear");
            clearBtn.x = spawnBtn.x + spawnBtn.width + 10;
            clearBtn.y = 10;
            clearBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
                clearParticles();
            });
            ui.addChild(clearBtn);

            gravityLabel = new TextField();
            gravityLabel.defaultTextFormat = new TextFormat("_sans", 12, 0xFFFFFF);
            gravityLabel.text = "Gravity: " + gravity.toFixed(2) + " (click to increase)";
            gravityLabel.x = clearBtn.x + clearBtn.width + 10;
            gravityLabel.y = 12;
            gravityLabel.selectable = false;
            gravityLabel.mouseEnabled = true;
            gravityLabel.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
                gravity += 0.05;
                if (gravity > 1) gravity = 0;
                gravityLabel.text = "Gravity: " + gravity.toFixed(2) + " (click to increase)";
            });
            ui.addChild(gravityLabel);
        }

        private function makeButton(label:String):Sprite {
            var s:Sprite = new Sprite();
            s.graphics.beginFill(0x333333);
            s.graphics.drawRoundRect(0, 0, 90, 24, 6, 6);
            s.graphics.endFill();

            var tf:TextField = new TextField();
            tf.defaultTextFormat = new TextFormat("_sans", 12, 0xFFFFFF);
            tf.text = label;
            tf.width = 90;
            tf.height = 24;
            tf.selectable = false;
            tf.mouseEnabled = false;
            tf.x = 5;
            tf.y = 4;
            s.addChild(tf);

            s.buttonMode = true;
            s.mouseChildren = false;
            return s;
        }

        private function spawn(n:int):void {
            for (var i:int = 0; i < n; i++) {
                var p:Sprite = new Sprite();
                var color:uint = Math.random() * 0xFFFFFF;
                var r:Number = 5 + Math.random() * 15;

                p.graphics.beginFill(color);
                p.graphics.drawCircle(0, 0, r);
                p.graphics.endFill();

                p.x = Math.random() * stage.stageWidth;
                p.y = Math.random() * stage.stageHeight * 0.5;
                p["vx"] = (Math.random() - 0.5) * 10;
                p["vy"] = (Math.random() - 0.5) * 10;
                p["r"] = r;

                addChild(p);
                particles.push(p);
            }
        }

        private function clearParticles():void {
            for each (var p:Sprite in particles) {
                if (contains(p)) removeChild(p);
            }
            particles = [];
        }

        private function onMouseDown(e:MouseEvent):void {
            mouseDown = true;
            mouseXPos = mouseX;
            mouseYPos = mouseY;
        }

        private function onMouseUp(e:MouseEvent):void {
            mouseDown = false;
        }

        private function onMouseMove(e:MouseEvent):void {
            mouseXPos = mouseX;
            mouseYPos = mouseY;
        }

        private function onEnterFrame(e:Event):void {
            graphics.beginFill(0x111111, 0.3);
            graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
            graphics.endFill();

            for each (var p:Sprite in particles) {
                var vx:Number = p["vx"];
                var vy:Number = p["vy"];
                var r:Number = p["r"];

                vy += gravity;
                p.x += vx;
                p.y += vy;

                // Walls
                if (p.x - r < 0) {
                    p.x = r;
                    vx *= -0.9;
                }
                if (p.x + r > stage.stageWidth) {
                    p.x = stage.stageWidth - r;
                    vx *= -0.9;
                }
                if (p.y - r < 0) {
                    p.y = r;
                    vy *= -0.9;
                }
                if (p.y + r > stage.stageHeight) {
                    p.y = stage.stageHeight - r;
                    vy *= -0.9;
                }

                // Mouse attraction
                if (mouseDown) {
                    var dx:Number = mouseXPos - p.x;
                    var dy:Number = mouseYPos - p.y;
                    var dist:Number = Math.sqrt(dx * dx + dy * dy) || 1;
                    var force:Number = 0.5 / dist;
                    vx += dx * force;
                    vy += dy * force;
                }

                p["vx"] = vx;
                p["vy"] = vy;
            }
        }
    }
}
