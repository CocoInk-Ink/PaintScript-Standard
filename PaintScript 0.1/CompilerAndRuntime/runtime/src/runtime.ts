// linked.json is the code
// build.json is the build map.

type Status = {
	RedrawNeeded:Boolean,
	Targets:Array<StatusTarget>,
	isPlaying:Boolean
};

type StatusTarget = {
	instance:string;
	x:number;
	y:number;

	direction:number;
	size:number;

	isShowing:Boolean;
};

interface LooseObject {
    [key: string]: any
}

type PObjectValue = PObject | string | number | Boolean | PFunction;

type PFunction = {
	name:string;
	params: Record<string, any>;
	body:LooseObject
}

class PObject {
	members:Record<string, PObjectValue>;

	constructor(members:Record<string, PObjectValue>) {
		this.members = members;
	}

	addMember(key:string, value:any) {
		this.members[key] = value;
	}
}

class DIItem {

	instanceName:string;
	x:number = 0; // Center
	y:number = 0; // Center
	direction:number = 90; // 90 is normal.
	size:number = 100; // Percentage of normal.
	
	isShowing:Boolean = true; // Is showing?

	constructor(instanceName:string) {
		this.instanceName = instanceName;
	}

	public Tick():void {}

	public toStatusTarget():StatusTarget {
		throw new Error("Method not implemented.");
	}
}

class SkinElement extends DIItem {
	ElementInstanceName:string;

	constructor(instance:string) {
		super("");
		this.ElementInstanceName = instance;
	}
}

class ImageSkinElement extends SkinElement {
	constructor(instance:string) { super(instance); }
}

class VideoSkinElement extends SkinElement {
	public length:number;
	public fps:number;
	public frame:number = 0; // Current frame

	public stopOnEnd:Boolean = false;
	public isPlaying:Boolean = false;

	public videoFolder:string = ""; // Output folder

	constructor(instance:string, frames:number, fps:number = 60) {
		super(instance);
		this.length = frames;
		this.fps = fps;
	}

	public override Tick():void {
		if (this.isPlaying) {
			if (this.frame > this.length) {
				if (!this.stopOnEnd) {
					this.isPlaying = false;
				} else this.frame = 0; // Reset and continue playing.
			}

			// bob?
			this.frame++;
		}
	}

	public play() {
		this.isPlaying = true;
		if (this.frame == this.length) this.frame = 0;
	}

	public stop() {
		this.isPlaying = false;
		if (this.frame < 0 || this.frame > this.length) this.frame = 0;
	}

	public gotoFrame(frame:number):void {
		if (frame > this.length) frame = 0;
		if (frame < 0) frame = this.length - frame; // Wrap, I think.

		this.frame = frame;
	}
}

class Skin {
	elements:Record<string, SkinElement> = {};
}

class Sprite extends DIItem {
	skins:Record<string, Skin> = {};
	constructor(instance:string) { super(instance); }

	loadSkin() {}
	loadSkinElement() {}
}

class Thread {
	body:Array<LooseObject> = [];
	line:number = 0;

	waitingOn:Array<string> = []; // List of ids of threads we are waiting on.

	threadId:string;

	isFinished:Boolean = false;

	constructor(threadId:string, body:Array<LooseObject> = []) {
		this.threadId = threadId;
		this.body = body;
	}

	public step():void {
		// Can run?
		if (this.waitingOn.length > 0) return; // Wait.
		if (this.body.length == 0) this.isFinished = true;

		// Run code
		let instr = this.body[this.line];

		const { op, fields } = instr;
		
		switch (op) {
			// Do one last check to see if this thread is suppose to run.
			case "comparator":
				break;
		}
	}
}

let isPlaying:Boolean = false;
let RedrawNeeded:Boolean = false;

let targets:Array<DIItem> = [];
let threads:Record<string, Thread> = {};
let threadIds:Array<string> = [];

function ToTargetStatus(targets:Array<DIItem>):Array<StatusTarget> {
	let ts:Array<StatusTarget> = [];
	targets.forEach(t => ts.push(t.toStatusTarget()));

	return ts;
}

function getCurrentState():Status {
	let status:Status = {
		isPlaying,
		RedrawNeeded,
		Targets: ToTargetStatus(targets)
	};

	return status;
}

function detectCirclerDependencies() {
	//
}

function addWaitingMessageThread() {}

function addThread(code:Array<LooseObject>) {
	const id = Date.now().toString();
	threadIds.push(id);
	threads[id] = new Thread(id, code);

	return id;
}

function deleteThread(id:string) {
	const threadForRemoval = threads[id];

	// First, remove the this id from any wait lists:
	for (const thread of Object.values(threads)) {
		if (thread.waitingOn.includes(threadForRemoval.threadId)) {
			thread.waitingOn.splice(thread.waitingOn.indexOf(threadForRemoval.threadId));
		}
	}

	// Then delete the thread.
	delete threads[id];
	delete threadIds[threadIds.indexOf(id)]; // And the id!
}

export function Tick() {
	if (!isPlaying) isPlaying = true;

	for (const [id, thread] of Object.entries(threads)) {
		if (thread.isFinished) deleteThread(id);
	}
}