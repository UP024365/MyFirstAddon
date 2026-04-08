import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { findNearestBlock } from "./utils.js";
import { getCurrentRoutine } from "./scheduleManager.js";

import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { findNearestBlock } from "./utils.js";
import { getCurrentRoutine, getJobMessage } from "./scheduleManager.js"; // getJobMessage 임포트 추가

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const nearbyVillagers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 15,
            families: ["villager"]
        });

        for (const villager of nearbyVillagers) {
            const healthComp = villager.getComponent("minecraft:health");
            if (!healthComp) continue;

            const currentHealth = healthComp.currentValue;
            const maxHealth = healthComp.defaultValue;

            // 1. 배고픔(체력 감소) 상태 체크 (최우선순위)
            if (currentHealth < maxHealth) {
                const chestPos = findNearestBlock(villager, "minecraft:chest", 10);

                if (chestPos) {
                    villager.teleport(villager.location, { facingLocation: chestPos });
                    showSpeechBubble(villager, `§6배고파... 밥 좀 먹어야겠어. [허기: ${currentHealth}]§r`, 40);

                    const dist = Math.sqrt(
                        Math.pow(villager.location.x - chestPos.x, 2) + 
                        Math.pow(villager.location.z - chestPos.z, 2)
                    );

                    if (dist < 2) {
                        healthComp.setCurrentValue(maxHealth); 
                        showSpeechBubble(villager, "§b(냠냠...) 역시 상자에 먹을 게 있었네!§r", 60);
                        villager.dimension.runCommand(`playsound random.levelup @a ${villager.location.x} ${villager.location.y} ${villager.location.z}`);
                    }
                } else {
                    showSpeechBubble(villager, `§c너무 배고픈데... 근처에 식량 저장고(상자)가 없나?§r`, 40);
                }
            } 
            // 2. 건강한 상태일 때 (직업 및 시간대 루틴)
            else {
                const time = world.getTimeOfDay();
                let message;

                // 낮 시간대(2000~12000 틱, 마크 기준 오전~오후)에는 직업 대사를 우선 출력
                if (time >= 2000 && time < 12000) {
                    message = getJobMessage(villager);
                } else {
                    // 아침, 저녁, 밤에는 기존 루틴 대사 출력
                    message = getCurrentRoutine();
                }
                
                showSpeechBubble(villager, message, 60);
            }
        }
    }
}, 20);

// 주민이 공격받는 순간을 감지하는 이벤트 리스너
world.afterEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity; // 맞은 엔티티

    // 맞은 엔티티가 주민(Villager)인지 확인
    if (victim.typeId === "minecraft:villager_v2") {
        const damageSource = event.damageSource.cause; // 공격 원인 (player, entity 등)
        
        let painMessage = "§c아야! 왜 때려!§r";
        
        // 공격 주체에 따른 가변 대사 (디테일 추가)
        if (damageSource === "entity") {
            painMessage = "§4으악! 몹이다! 살려줘!§r";
        } else if (damageSource === "player") {
            painMessage = "§c아야! 갑자기 왜 그러세요?§r";
        }

        // 즉시 말풍선 출력 (기존 대사를 덮어씌움)
        showSpeechBubble(victim, painMessage, 40);
    }
});