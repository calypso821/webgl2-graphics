import { Character, Camera } from '../core.js';


export class CharacterActionController {

    constructor(node, domElement, weapon_system) {
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

        character.activeWeapon = character.getPrimaryWeapon();
        character.activeWeapon.node.visible = true;

        this.node.addComponent(character);
        this.character = character;
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
        // DELTE this?? 
        // TODO fire rate, delta time 
        //this.action_system.processFireAction(this.node)
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
            // Move this to Weaponsystem or Weapon.js
            if (this.character.activeWeapon.name == "sniper") {
                this.camera.fovy = 0.4;
                this.character.activeWeapon.node.visible = false;
            }
            
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
            this.camera.fovy = 1;
            this.character.activeWeapon.node.visible = true;
        }
        
    }
    
}
