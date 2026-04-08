import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { findNearestBlock } from "./utils.js";
import { getCurrentRoutine } from "./scheduleManager.js";

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

            // 체력이 깎인 상태를 '배고픔'으로 해석
            if (currentHealth < maxHealth) {
                const chestPos = findNearestBlock(villager, "minecraft:chest", 10);

                if (chestPos) {
                    villager.teleport(villager.location, { facingLocation: chestPos });
                    // 요청하신 부드러운 멘트로 수정
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
            } else {
                const routineMessage = getCurrentRoutine();
                showSpeechBubble(villager, routineMessage, 60);
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