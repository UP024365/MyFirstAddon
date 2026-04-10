import { world } from "@minecraft/server";
// showSpeechBubble 대신 addDialogue를 임포트합니다.
import { addDialogue, isVillagerTalking } from "./chatManager.js";

world.sendMessage("§b[모듈 로드] needsManager.js 연결 완료§r");

// 주민의 허기 수치를 저장할 Map
const villagerHunger = new Map();

/**
 * 주민의 허기 상태를 업데이트합니다.
 */
export function updateHunger(villager) {
    const id = villager.id;
    
    if (!villagerHunger.has(id)) {
        villagerHunger.set(id, 100);
    }

    let currentHunger = villagerHunger.get(id);

    if (Math.random() < 0.1) {
        currentHunger = Math.max(0, currentHunger - 1);
        villagerHunger.set(id, currentHunger);
    }

    return currentHunger;
}

/**
 * 주민의 허기를 회복시킵니다.
 */
export function recoverHunger(villager, amount = 50) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;
    currentHunger = Math.min(100, currentHunger + amount); 
    villagerHunger.set(id, currentHunger);
    return currentHunger;
}

/**
 * 주민이 월드에서 제거되었을 때 데이터를 정리합니다.
 */
export function removeVillagerData(villagerId) {
    villagerHunger.delete(villagerId);
}

/**
 * 주변 바닥에 떨어진 음식을 탐색하고 줍습니다.
 */
export function pickupFoodOnGround(villager, healthComp) {
    const nearbyItems = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: 2.5,
        type: "minecraft:item"
    });

    for (const itemEntity of nearbyItems) {
        const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
        if (!itemStack) continue;

        const itemId = itemStack.typeId.toLowerCase();
        if (["bread", "apple", "carrot", "potato"].some(f => itemId.includes(f))) {
            itemEntity.kill(); 
            
            recoverHunger(villager, 50); 
            
            const maxHealth = healthComp.effectiveMax ?? 20;
            healthComp.setCurrentValue(maxHealth);

            // 음식을 주웠을 때는 기쁜 상태이므로 우선순위 5를 부여합니다.
            addDialogue(villager, "§d와! 주신 음식 정말 맛있게 잘 먹을게요!§r", 60, 5);
            
            world.sendMessage(`§d[DEBUG] 주민(${villager.id.slice(-4)})이 바닥의 음식을 주웠습니다.§r`);

            const { x, y, z } = villager.location;
            villager.dimension.runCommandAsync(`playsound random.pop @a ${x} ${y} ${z}`).catch(()=>{}); 
            return true; 
        }
    }
    return false;
}

/**
 * 인벤토리의 음식을 먹거나, 음식이 없으면 배고픔을 호소합니다.
 */
export function eatFromInventory(villager, currentHunger, healthComp) {
    const maxHealth = healthComp.effectiveMax ?? 20;

    if (currentHunger <= 30 || healthComp.currentValue < maxHealth) {
        const inventory = villager.getComponent("minecraft:inventory")?.container;
        let foodSlot = -1;

        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (!item) continue;
                if (["bread", "apple", "carrot", "potato"].some(f => item.typeId.includes(f))) {
                    foodSlot = i;
                    break;
                }
            }
        }

        if (foodSlot !== -1) {
            const item = inventory.getItem(foodSlot);
            if (item.amount > 1) { 
                item.amount -= 1; 
                inventory.setItem(foodSlot, item); 
            } else { 
                inventory.setItem(foodSlot, undefined); 
            }

            recoverHunger(villager, 70);
            healthComp.setCurrentValue(maxHealth);

            // 식사 중 대사는 생존과 직결되므로 우선순위 6을 부여합니다.
            addDialogue(villager, "§b(냠냠...) 아껴뒀던 음식을 먹어야지.§r", 60, 6);
            
            world.sendMessage(`§b[DEBUG] 주민(${villager.id.slice(-4)})이 인벤토리 음식을 먹었습니다.§r`);
            
            return true; 
        } else if (currentHunger < 10) {
            // 배고픔 호소는 일상 대사보다 중요한 신호이므로 우선순위 4를 부여합니다.
            if (!isVillagerTalking(villager.id)) {
                addDialogue(villager, "§c배고파서 기운이 없어...§r", 40, 4);
                world.sendMessage(`§c[DEBUG] 주민(${villager.id.slice(-4)})이 음식이 없어 굶주리고 있습니다!§r`);
            }
        }
    }
    return false; 
}