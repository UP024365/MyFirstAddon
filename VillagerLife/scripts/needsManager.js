import { world } from "@minecraft/server";
import { showSpeechBubble, isVillagerTalking } from "./chatManager.js";

world.sendMessage("§b[모듈 로드] needsManager.js 연결 완료§r");

// 주민의 허기 수치를 저장할 Map
const villagerHunger = new Map();

/**
 * 주민의 허기 상태를 업데이트합니다.
 */
export function updateHunger(villager) {
    const id = villager.id;
    
    // 데이터 초기화 보장
    if (!villagerHunger.has(id)) {
        villagerHunger.set(id, 100);
    }

    let currentHunger = villagerHunger.get(id);

    // 10% 확률로 소화 (약 15초당 허기 1 감소)
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

// --- [추가된 행동 로직 1] 바닥 음식 줍기 ---
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
        // 인식할 음식 리스트
        if (["bread", "apple", "carrot", "potato"].some(f => itemId.includes(f))) {
            itemEntity.kill(); // 아이템 제거
            
            recoverHunger(villager, 50); // 허기 회복
            
            // 체력 회복 (defaultValue 대신 안전하게 effectiveMax 사용)
            const maxHealth = healthComp.effectiveMax ?? 20;
            healthComp.setCurrentValue(maxHealth);

            showSpeechBubble(villager, "§d와! 주신 음식 정말 맛있게 잘 먹을게요!§r", 60, true);
            
            // [디버그] 채팅창 출력
            world.sendMessage(`§d[DEBUG] 주민(${villager.id.slice(-4)})이 바닥의 음식을 주웠습니다.§r`);

            const { x, y, z } = villager.location;
            villager.dimension.runCommandAsync(`playsound random.pop @a ${x} ${y} ${z}`).catch(()=>{}); 
            return true; 
        }
    }
    return false;
}

// --- [추가된 행동 로직 2] 인벤토리 식사 또는 배고픔 호소 ---
/**
 * 인벤토리의 음식을 먹거나, 음식이 없으면 배고픔을 호소합니다.
 */
export function eatFromInventory(villager, currentHunger, healthComp) {
    const maxHealth = healthComp.effectiveMax ?? 20;

    // 허기가 낮거나 체력이 깎였을 때 실행
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
            showSpeechBubble(villager, "§b(냠냠...) 아껴뒀던 음식을 먹어야지.§r", 60, true);
            
            // [디버그] 채팅창 출력
            world.sendMessage(`§b[DEBUG] 주민(${villager.id.slice(-4)})이 인벤토리 음식을 먹었습니다.§r`);
            
            return true; // 행동 완료
        } else if (currentHunger < 10) {
            // 음식이 없을 때 징징대기 (말하고 있지 않을 때만)
            if (!isVillagerTalking(villager.id)) {
                showSpeechBubble(villager, "§c배고파서 기운이 없어...§r", 40);
                world.sendMessage(`§c[DEBUG] 주민(${villager.id.slice(-4)})이 음식이 없어 굶주리고 있습니다!§r`);
            }
        }
    }
    return false; 
}