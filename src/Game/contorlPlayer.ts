import Game from '.';
import {GAME_STATUS, Obstacal, playerStatus} from './const';
import Environment, {roadLength, roadWidth} from './environment';
// import {SceneOctree} from './octree';
import * as THREE from 'three';
import {EventEmitter} from 'events';
import Player from './player';
// @ts-ignore
import showToast from '../components/Toast/index.js';
enum Side {
    FRONT,
    BACK,
    LEFT,
    RIGHT,
    DOWN,
    FRONTDOWN,
    UP
}
export class ControlPlayer extends EventEmitter {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    status!: string;
    renderer!: THREE.WebGLRenderer;
    score: number = 0;
    coin: number = 0;
    allAnimate: Record<string, THREE.AnimationAction>;
    // velocity = new THREE.Vector3(0, 0, 0);
    runVelocity: number;
    jumpHight: number;
    targetPosition!: number;
    // Current track
    way!: number;
    lastPosition!: number;
    // sceneOctree!: SceneOctree;
    isJumping: boolean = false;
    capsule!: THREE.Mesh<THREE.CapsuleGeometry, THREE.MeshNormalMaterial>;
    game: Game;
    player: Player;
    scene: THREE.Scene = new THREE.Scene();
    smallMistake!: number;
    far: number;
    key!: string;
    // Original track
    originLocation!: THREE.Vector3;
    // Stores single left/right collision
    removeHandle: boolean = true;
    lastAnimation!: string;
    // Whether roll action is being executed
    roll!: boolean;
    // Whether looking back action is being executed
    runlookback!: boolean;
    // çŽ©å®¶è·‘æ­¥è·ç¦»
    playerRunDistance!: number;
    environement: Environment = new Environment();
    // Current floor tile
    currentPlane: number = -1;
    // Whether to add floor
    isAddPlane: boolean = false;
    fallingSpeed: number = 0; // Falling speed
    downCollide: boolean = false; // Whether character is on ground

    gameStatus: GAME_STATUS = GAME_STATUS.READY; // æ¯”èµ›çŠ¶æ€
    gameStart: boolean = false;
    raycasterDown: THREE.Raycaster;
    raycasterFrontDown: THREE.Raycaster;
    raycasterFront: THREE.Raycaster;
    raycasterRight: THREE.Raycaster;
    raycasterLeft: THREE.Raycaster;
    frontCollide: boolean;
    firstFrontCollide: Record<string, any> = {isCollide: true, collideInfo: null};
    frontCollideInfo: any;
    leftCollide: boolean;
    rightCollide: boolean;
    upCollide: boolean;
    constructor(
        model: THREE.Group,
        mixer: THREE.AnimationMixer,
        currentAction: string = 'run',
        allAnimate: Record<string, THREE.AnimationAction>
    ) {
        super();
        this.model = model;
        this.mixer = mixer;
        this.game = new Game();
        this.player = new Player();
        this.scene = this.game.scene;
        this.allAnimate = allAnimate;
        // è·‘æ­¥é€Ÿåº¦
        this.runVelocity = 20;
        // è·³è·ƒé«˜åº¦
        this.jumpHight = 3.3;
        this.gameStart = false;
        this.far = 2.5; // äººç‰©èº«é«˜
        this.raycasterDown = new THREE.Raycaster();
        this.raycasterFrontDown = new THREE.Raycaster();
        this.raycasterFront = new THREE.Raycaster();
        this.raycasterRight = new THREE.Raycaster();
        this.raycasterLeft = new THREE.Raycaster();
        this.frontCollide = false;
        this.leftCollide = false;
        this.rightCollide = false;
        this.downCollide = true;
        this.upCollide = false;
        this.isJumping = false;
        this.startGame(currentAction, model);
        this.addAnimationListener();
        this.initRaycaster();
    }
    // å¼€å§‹æ¸¸æˆåˆå§‹åŒ–
    startGame(currentAction: string, model: THREE.Group) {
        this.status = currentAction;
        this.allAnimate[currentAction].play();
        this.lastAnimation = currentAction;
        // å½“å‰é“è·¯
        this.way = 2;
        // æ˜¯å¦åœ¨æ»šåŠ¨
        this.roll = false;
        // æ˜¯å¦å‘åŽçœ‹
        this.runlookback = false;
        this.playerRunDistance = model.position.z;
        this.smallMistake = 0;
        this.key = '';
        this.originLocation = model.position;
        this.lastPosition = model.position.x;
        this.targetPosition = 0;
    }

    initRaycaster() {
        // åˆ›å»ºä¸€ä¸ªåˆå§‹æ–¹å‘ï¼Œä¾‹å¦‚æŒ‡å‘Zè½´
        const initialDirection = new THREE.Vector3(0, -1, 0);
        // ä½¿ç”¨Quaternionè¿›è¡Œæ—‹è½¬ï¼Œåˆ›å»ºä¸€ä¸ª30åº¦çš„æ—‹è½¬
        const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6); // 30åº¦æ˜¯å¼§åº¦åˆ¶çš„
        // å°†åˆå§‹æ–¹å‘æ—‹è½¬çº¦30åº¦
        const direction = initialDirection.clone().applyQuaternion(rotation).normalize();
        this.raycasterFrontDown.ray.direction = new THREE.Vector3(0, 1, 0);
        // æ–œå‘ä¸‹çš„å°„çº¿
        this.raycasterDown.ray.direction = new THREE.Vector3(0, -1, 0);
        this.raycasterFrontDown.ray.direction = direction;
        this.raycasterLeft.ray.direction = new THREE.Vector3(-1, 0, 0);
        this.raycasterRight.ray.direction = new THREE.Vector3(1, 0, 0);

        this.raycasterDown.far = 5.8;
        this.raycasterFrontDown.far = 3;
    }
    // @ts-ignore
    addAnimationListener() {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const key = e.key;
            // å¼€å§‹æ¸¸æˆ
            if (key === 'p') {
                if (!this.gameStart) {
                    this.gameStart = true;
                    this.gameStatus = GAME_STATUS.START;
                    this.key === 'p';
                    this.game.emit('gameStatus', this.gameStatus);
                }
            }
            else if (
                key === 'w'
                && this.status !== playerStatus.JUMP
                && this.status !== playerStatus.FALL
                && this.downCollide
            ) {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }

                this.key = 'w';
                this.downCollide = false;
                this.isJumping = true;
                setTimeout(() => {
                    this.isJumping = false;
                }, 50);
                this.fallingSpeed += this.jumpHight * 0.1;
            }
            else if (key === 's' && !this.roll && this.status !== playerStatus.ROLL) {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }
                this.roll = true;
                setTimeout(() => {
                    this.roll = false;
                }, 620);
                this.key = 's';
                this.fallingSpeed = -5 * 0.1;
            }
            else if (key === 'a') {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }
                // ä½äºŽæœ€å·¦è¾¹çš„é“è·¯
                if (this.way === 1) {
                    this.runlookback = true;
                    this.emit('collision');
                    showToast('æ’žåˆ°éšœç¢ç‰©ï¼è¯·æ³¨æ„ï¼ï¼ï¼');
                    setTimeout(() => {
                        this.runlookback = false;
                    }, 1040);
                    this.smallMistake += 1;
                    return;
                }
                this.way -= 1;
                this.originLocation = this.model.position.clone();
                this.lastPosition = this.model.position.clone().x;
                this.targetPosition -= roadWidth / 3;
            }
            else if (key === 'd') {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }
                if (this.way === 3) {
                    this.runlookback = true;
                    this.emit('collision');
                    showToast('æ’žåˆ°éšœç¢ç‰©ï¼è¯·æ³¨æ„ï¼ï¼ï¼');
                    setTimeout(() => {
                        this.runlookback = false;
                    }, 1040);
                    this.smallMistake += 1;
                    return;
                }
                this.originLocation = this.model.position.clone();
                this.lastPosition = this.model.position.clone().x;
                this.targetPosition += roadWidth / 3;
                this.way += 1;
            }
            else if (key === 'r') {
                this.gameStatus = GAME_STATUS.READY;
                this.game.emit('gameStatus', this.gameStatus);
                this.smallMistake = 0;
                while (this.scene.children.length > 0) {
                    this.scene.remove(this.scene.children[0]);
                }
                // disposeNode(this.scene);
                this.environement.startGame();
                this.player.createPlayer(false);
            }
        });
    }
// å·¦å³ç§»åŠ¨æŽ§åˆ¶
handleLeftRightMove() {
    const targetPosition = this.targetPosition;
    const lastPosition = this.lastPosition;
    if (Math.abs(targetPosition - lastPosition) < 1) {
        this.removeHandle = true;
    }
    if (targetPosition !== lastPosition) {
        // removehandleå¤„ç†å•æ¬¡ç¢°æ’ž
        // å¤„ç†å·¦å³ç¢°æ’žå›žå¼¹æ•ˆæžœ
        if ((this.leftCollide || this.rightCollide) && this.removeHandle) {
            this.smallMistake += 1;
            this.emit('collision');
            showToast('æ’žåˆ°éšœç¢ç‰©ï¼è¯·æ³¨æ„ï¼ï¼ï¼');
            this.targetPosition = this.originLocation.x;
            this.removeHandle = false;
            if (targetPosition > lastPosition) {
                this.way -= 1;
            }
            else {
                this.way += 1;
            }
        }
        // å¹³æ»‘ç§»åŠ¨é€»è¾‘
        const moveSpeed = 0.15; // ç§»åŠ¨é€Ÿåº¦
        const diff = targetPosition - lastPosition;
        if (Math.abs(diff) > 0.0001) {
            this.model.position.x += diff * moveSpeed;
            this.lastPosition += diff * moveSpeed;
        }
    }
}
    // ä¸Šä¸‹ç§»åŠ¨æŽ§åˆ¶
    handleUpdownMove() {
    }
    // å…¨éƒ¨å°„çº¿ç¢°æ’žæ£€æµ‹
    collideCheckAll() {
        const position = this.model.position.clone();
        try {
            // åœ°é¢æ£€æµ‹  farå°„çº¿é•¿åº¦
            this.collideCheck(Side.DOWN, position, 5);
            this.collideCheck(Side.FRONTDOWN, position, 3);
            this.collideCheck(Side.FRONT, position, 2);
            this.collideCheck(Side.LEFT, position, 1);
            this.collideCheck(Side.RIGHT, position, 1);
        }
        catch (error) {
            console.log(error);
        }

    }
    // å•ä¸ªå°„çº¿ç¢°æ’žæ£€æµ‹
    collideCheck(
        side: Side,
        position: THREE.Vector3,
        far: number = 2.5
    ) {
        const {x, y, z} = position;
        switch (side) {
            case Side.DOWN:
                this.raycasterDown.ray.origin = new THREE.Vector3(x, y + 4, z + 0.5);
                this.raycasterDown.far = far;
                break;
            case Side.FRONTDOWN:
                this.raycasterFrontDown.ray.origin = new THREE.Vector3(x, y + 2, z);
                this.raycasterFrontDown.far = far;
                break;
            case Side.FRONT:
                this.raycasterFront.ray.origin = new THREE.Vector3(x, y + 2, z - 1);
                this.raycasterFront.far = far;
            case Side.LEFT:
                this.raycasterLeft.ray.origin = new THREE.Vector3(x + 0.5, y + 2, z);
                this.raycasterLeft.far = far;
            case Side.RIGHT:
                this.raycasterRight.ray.origin = new THREE.Vector3(x - 0.5, y + 2, z);
                this.raycasterRight.far = far;
        }
        // const arrowHelper = new THREE.ArrowHelper(
        //     this.raycasterFront.ray.direction,
        //     this.raycasterFront.ray.origin,
        //     this.raycasterFront.far,
        //     0xff0000
        // );
        // this.scene.add(arrowHelper);
        const ds = this.playerRunDistance;
        // å½“å‰æ‰€åœ¨çš„åœ°æ¿å—
        const nowPlane = Math.floor(ds / roadLength);
        const intersectPlane = this.environement.plane?.[nowPlane];
        const intersectObstacal = this.environement.obstacal?.[nowPlane];
        const intersectCoin = this.environement.coin?.[nowPlane];
        if (!intersectObstacal && !intersectPlane) {
            return;
        }
        // update collide
        const origin = new THREE.Vector3(x, position.y + 3, z);
        const originDown = new THREE.Vector3(x, position.y + 4.6, z - 0.5);
        switch (side) {
            case Side.DOWN: {
                if (!intersectPlane) {
                    return;
                }
                const c1 = this.raycasterDown.intersectObjects(
                    [intersectPlane, intersectObstacal]
                )[0]?.object.name;
                this.raycasterDown.ray.origin = originDown;
                const c2 = this.raycasterDown.intersectObjects(
                    [intersectPlane, intersectObstacal]
                )[0]?.object.name;
                c1 || c2 ? (this.downCollide = true) : (this.downCollide = false);
                break;
            }
            case Side.FRONT: {
                const r1 = this.raycasterFront.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterFront.far = 1.5;
                const r2 = this.raycasterFront.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin') {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                // æ’žå‡»ç‚¹ä¿¡æ¯
                const c2 = r2Name && r2Name !== 'coin';
                this.frontCollideInfo = r1 || r2;
                c1 || c2 ? (this.frontCollide = true) : (this.frontCollide = false);
                break;
            }
            case Side.FRONTDOWN: {
                const r1 = this.raycasterFrontDown.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                c1 ? (this.frontCollide = true) : (this.frontCollide = false);
                break;
            }
            case Side.LEFT: {
                const r1 = this.raycasterLeft.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterLeft.ray.origin = origin;
                const r2 = this.raycasterLeft.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin') {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                // æ’žå‡»ç‚¹ä¿¡æ¯
                const c2 = r2Name && r2Name !== 'coin';
                c1 || c2 ? (this.leftCollide = true) : (this.leftCollide = false);
                break;
            }
            case Side.RIGHT: {
                const r1 = this.raycasterRight.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterRight.ray.origin = origin;
                const r2 = this.raycasterRight.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin') {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                // æ’žå‡»ç‚¹ä¿¡æ¯
                const c2 = r2Name && r2Name !== 'coin';
                c1 || c2 ? (this.rightCollide = true) : (this.rightCollide = false);
                break;
            }
        }
    }
    // æŽ§åˆ¶äººç‰©çš„åŠ¨ä½œå˜åŒ–
    changeStatus(delta: number) {
        if (!this.gameStart) {
            return;
        }
        const moveZ = this.runVelocity * delta;
        if (!this.frontCollide) {
            if (this.status !== playerStatus.DIE) {
                this.playerRunDistance += moveZ;
                this.model.position.z -= moveZ;
            }
        }
        if (this.status === playerStatus.DIE) {
            this.status = playerStatus.DIE;
        }
        else if (this.fallingSpeed > 0) {
            this.status = playerStatus.JUMP;
        }
        else if (this.fallingSpeed < 0 && this.key !== 's') {
            this.status = playerStatus.FALL;
        }
        else if (this.roll) {
            this.status = playerStatus.ROLL;
        }
        else if (this.key === 'p') {
            this.status = playerStatus.RUN;
        }
        else if (!this.roll && this.fallingSpeed === 0 && !this.runlookback) {
            this.status = playerStatus.RUN;
        }
        else if (this.runlookback) {
            this.status = playerStatus.RUNLOOKBACK;
        }
        // é‡å¤åŠ¨ç”»ä¸æ‰§è¡Œ
        if (this.status === this.lastAnimation) {
            return;
        }
        this.lastAnimation && this.allAnimate[this.lastAnimation].fadeOut(0.1);
        this.allAnimate[this.status].reset().fadeIn(0.1).play();
        this.lastAnimation = this.status;
    }
    // æ£€æŸ¥çŽ©å®¶è·ç¦»
    checkPlayerDistance() {
        const ds = this.playerRunDistance;
        // å½“å‰æ‰€åœ¨çš„åœ°æ¿å—
        const nowPlane = Math.floor(ds / roadLength) + 1;

        // å½“å‰èµ°çš„è·¯ç¨‹ç«™æ€»é•¿åº¦çš„ç™¾åˆ†æ¯”
        // å½“åˆ°è¾¾45%çš„æ—¶å€™åŠ¨æ€æ·»åŠ åœºæ™¯  æ— é™åœ°å›¾
        const runToLength = (ds - roadLength * (nowPlane - 1)) / roadLength;
        if (runToLength > 0.45 && this.currentPlane !== nowPlane) {
            console.log('æ·»åŠ ä¸‹ä¸€ä¸ªåœ°æ¿');
            this.currentPlane = nowPlane;
            this.environement.z -= roadLength;
            const newZ = this.environement.z;
            // æ”¾ç½®åœ¨zè½´æ–¹å‘ä¸Š
            this.environement.setGroupScene(newZ, -5 - nowPlane * roadLength, false);
        }
    }
    // å‘å‰çš„ç¢°æ’žæ£€æµ‹åˆ¤å®š
    frontCollideCheckStatus() {
        if (this.frontCollide && this.firstFrontCollide.isCollide) {
            const {object} = this.frontCollideInfo;
            const {y} = this.frontCollideInfo.point;
            const point = Number(y - 2);
            const obstacal = Number(Obstacal[object.name]?.y);
            // è®¡ç®—æ’žå‡»é¢ç§¯ç™¾åˆ†æ¯”
            const locateObstacal = point / obstacal;
            console.log('éšœç¢ç‰©', object.name, 'éšœç¢ç‰©çš„ç™¾åˆ†æ¯”', locateObstacal);
            this.firstFrontCollide = {isCollide: false, name: object.name};
            // éšœç¢ç‰©æ’žå‡»é¢ç§¯å¤§äºŽ0.75ï¼Œç›´æŽ¥åˆ¤å®šæ¸¸æˆç»“æŸ æ’­æ”¾è§’è‰²æ­»äº¡åŠ¨ç”»
            if (locateObstacal < 0.75) {
                this.status = playerStatus.DIE;
                this.gameStatus = GAME_STATUS.END;
                showToast('ä½ æ­»äº†ï¼è¯·é‡æ–°å¼€å§‹æ¸¸æˆï¼');
                this.status = playerStatus.DIE;
this.gameStatus = GAME_STATUS.END;
this.game.emit('gameStatus', this.gameStatus);
const userId = localStorage.getItem("user_id");
const score = this.score;

if (userId && score > 0) {
    const repo = "princegamer137/SUBWAY-SURFERS";
    const path = "data/scores.json";
    const token = "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"; // Your GitHub token

    fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: "GET",
       
