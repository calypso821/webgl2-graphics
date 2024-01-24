export class GameSystem {
    constructor(scenes) {
        this.scenes = scenes;
        this.scene_system = null;   
        this.initializeGameObjectives();  
    }
    async start() {
        const scene = this.getScene(this.startLevel);
        await this.scene_system.initializeScene(scene);
    }
    switchScene(next_level) {
        if (!next_level) {
           console.log("End of the game!")
           return;
        }
        this.scene_system.initializeScene(this.getScene(next_level));
    }
    getObjectives(level) {
        return this.gameObjectives[level];
    }
    getCurrentObjectives() {
        return this.getObjectives(this.activeLevel);
    }
    getScene(level) {
        this.activeLevel = level;
        return this.scenes[this.getObjectives(level).scene];
    }

    restart() {
        // Set start scene (start over)
        setTimeout(() => {
            this.switchScene(this.startLevel);
        }, 2000);
    }
    initializeGameObjectives() {
        const gameObjectives = {};
        gameObjectives.L1 = {
            // Objectives for level1
            name: 'Level 1',
            kills: 10,
            opponents: ['zombie', 'terrorist'],
            boss: 'eye',
            scene: 'scene1',
            spawnRate: 3,       // every 3 seconds 
            next_level: 'L2',
        };
     
        gameObjectives.L2 = {
            // Objectives for level2
            name: 'Level 2',
            kills: 10,
            opponents: ['zombie', 'purpleDragon', 'redDragon'],
            boss: 'bigDragon',
            spawnRate: 4,
            scene: 'scene2',
            next_level: 'L3',
        };
  

        gameObjectives.L3 = {
            // Objectives for level3
            name: 'Level 3',
            kills: 10,
            opponents: ['purpleDragon', 'redDragon', 'bigDragon'],
            boss: 'bossDragon',
            spawnRate: 6,
            scene: 'scene2',
            next_level: null,
        };


        this.gameObjectives = gameObjectives;
        // Default / starting level
        this.startLevel = 'L1';
    }
}