import { Character, Camera, HUD, TextElement, SpotLight, Node, Transform } from '../core.js';

export class CharacterActionController {

    constructor(node, domElement, weapon_system, hud_system) {
        this.hud_system = hud_system;
        this.node = node;
        this.camera = node.getComponentOfType(Camera);
        this.domElement = domElement;
        this.weapon_system = weapon_system;

        this.cd = false;
        this.keys = {}; 
        this.leftClickHeld = false;
        this.rightClickHeld = false;
        this.leftClickHeldTime = 0;
        
        this.initHandlers();
        this.initCharacter();
        this.initCharacterHUD();
    }

    initHandlers() {
        this.mouseClickHandler = this.mouseClickHandler.bind(this);
        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);

        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.mouseUpHandler = this.mouseUpHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keyDownHandler);
        doc.addEventListener('keyup', this.keyUpHandler);
        doc.addEventListener('click', this.mouseClickHandler);
        doc.addEventListener('mousedown', this.mouseDownHandler);
        doc.addEventListener('mouseup', this.mouseUpHandler);

        
    }
    
    initCharacter() {
        const character = new Character({
            node: this.node,
            health: 200,
            armor: 2,
            maxSpeed: 5
        });
        character.setPrimaryWeapon(this.weapon_system.getWeapon('ak47_rifle'));
        character.setSecondaryWeapon(this.weapon_system.getWeapon('sniper_rifle'));
        character.setSpecialWeapon(this.weapon_system.getWeapon('rpg'));
        character.setActiveWeapon(character.getPrimaryWeapon());

        this.node.addComponent(character);
        this.character = character;
        const flashLight = this.createFlashLight();
        this.character.flashLight = flashLight.getComponentOfType(SpotLight);
        this.node.addChild(flashLight);
    }

    createFlashLight() {
        const flash_light = new Node();
        flash_light.addComponent(new Transform({
            translation: [0, 0, -0.7],
        }));
        flash_light.addComponent(new SpotLight({ 
            intensity: 0, 
            blendFactor: 0.2, 
            halfAngle: Math.PI/8 ,
            main: true,
        }));
        return flash_light;
    }

    initCharacterHUD() {
        const char_hud = new HUD();
        // 1. Health 
        char_hud.addElement(new TextElement({
            id: 'health',
            text: "Health: ",
            color: 'red',
            position: [50, 650], 
        }));
        // 2. Active Weapon
        char_hud.addElement(new TextElement({
            id: 'weapon',
            text: "Weapon: ",
            position: [50, 700], 
        })); 
        // 3. Magazine capacity/size
        char_hud.addElement(new TextElement({
            id: 'magazine',
            text: "Magazine: ",
            position: [50, 750], 
        })); 
        // 4. Reloading
        char_hud.addElement(new TextElement({
            id: 'reload',
            text: "Reloading...",
            position: [50, 800], 
            visible: false
        })); 
        // 5. FlashLight status
        char_hud.addElement(new TextElement({
            id: 'flash_light',
            color: 'yellow',
            text: "Flash light: ",
            position: [50, 550], 
        }));
         // 6. Laser status
         char_hud.addElement(new TextElement({
            id: 'laser_status',
            text: "Laser: ",
            color: 'yellow',
            position: [50, 500], 
        }));

        this.node.addComponent(char_hud);
        this.hud_system.addElement(char_hud);
    }

    update(t, dt) {
        if (this.keys['Digit1']) {
            // Set primary weapon
            this.character.switchActiveWeapon(this.character.getPrimaryWeapon());
            delete this.keys['Digit1'];
        }
        if (this.keys['Digit2']) {
            // Set secondary weapon
            this.character.switchActiveWeapon(this.character.getSecondaryWeapon());
            delete this.keys['Digit2'];
        }
        if (this.keys['Digit3']) {
            // Set special weapon
            this.character.switchActiveWeapon(this.character.getSpecialWeapon());
            delete this.keys['Digit3'];
        }
        if (this.keys['KeyR']) {
            this.character.reloadWeapon();
            delete this.keys['KeyR'];
        }
        if (this.keys['KeyQ']) {
            this.character.toggleflashLight();
            delete this.keys['KeyQ'];
        }
        if (this.keys['KeyE']) {
            const laser = this.weapon_system.createLaserRay();
            this.character.toggleLaser(laser);
            delete this.keys['KeyE'];
        }
        if (this.leftClickHeld) {
            this.weapon_system.processFireAction(this.node, this.leftClickHeldTime);
            this.leftClickHeldTime += dt;
        }
    }

    keyDownHandler(e) {
        this.keys[e.code] = true;
    }

    keyUpHandler(e) {
        this.keys[e.code] = false;
    }

    mouseClickHandler(e) {
        // Hanlder for mouse click
    }
    mouseDownHandler(e) {
        // Mouse down
        if (e.button === 0) {
            // Left click
            this.leftClickHeld = true;
            this.leftClickHeldTime = 0;
        }
        if (e.button === 2) {
            // Right click
            this.rightClickHeld = true;
            // Zoom 
            this.character.toggleScope(this.node);  
        }
        
    }
    mouseUpHandler(e) {
        // Mouse up
        if (e.button === 0) {
            // Left click
            this.leftClickHeld = false;
        }
        if (e.button === 2) {
            // Right click 
            this.rightClickHeld = false;
            // Unzoom
            this.character.toggleScope(this.node); 
        }
    } 
}
