import { system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js"; // 🔥 이 줄이 반드시 있어야 합니다!

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
    const enemies = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: 10,
        families: ["monster"]
    }).filter(e => Math.abs(e.location.y - villager.location.y) < 6);

    if (enemies.length > 0) {
        const id = villager.id;
        if (!panickingVillagers.has(id)) {
            const rawId = enemies[0].typeId.replace("minecraft:", "");
            const name = mobNames[rawId] || "괴물";
            
            // 이제 import를 했으므로 에러 없이 작동합니다.
            showSpeechBubble(villager, `§4으악! 저기 ${name} 나타났다! 도망쳐!§r`, 60, true);
            
            const tid = system.runTimeout(() => panickingVillagers.delete(id), 60);
            panickingVillagers.set(id, tid);
        }
        return true; 
    }
    return false;
}