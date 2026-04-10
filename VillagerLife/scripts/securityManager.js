import { system } from "@minecraft/server";
import { addDialogue } from "./chatManager.js"; 

const panickingVillagers = new Map();
const mobNames = { 
    "zombie": "좀비", 
    "drowned": "물좀비", 
    "husk": "사막좀비", 
    "zombie_villager": "좀비 주민",
    "skeleton": "스켈레톤", 
    "creeper": "크리퍼", 
    "spider": "거미" 
};

export function updateSecurity(villager) {
    // 주민의 역할 확인 (CITIZEN / MILITIA)
    const role = villager.getDynamicProperty("village:role") || "CITIZEN";
    
    const enemies = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: role === "MILITIA" ? 15 : 10,
        families: ["monster"]
    }).filter(e => Math.abs(e.location.y - villager.location.y) < 6);

    if (enemies.length > 0) {
        const id = villager.id;
        const target = enemies[0];
        const rawId = target.typeId.replace("minecraft:", "");
        const name = mobNames[rawId] || "괴물";

        if (!panickingVillagers.has(id)) {
            if (role === "MILITIA") {
                // 자경단: 전투 대사
                addDialogue(villager, `§6전투 태세! 저기 ${name}(을)를 처리하겠다!§r`, 60, 10);
            } else {
                // 일반 주민: 도망 대사
                addDialogue(villager, `§4으악! 저기 ${name} 나타났다! 도망쳐!§r`, 60, 10);
            }
            
            const tid = system.runTimeout(() => panickingVillagers.delete(id), 60);
            panickingVillagers.set(id, tid);
        }
        return true; 
    }
    return false;
}