import { system, world } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";

world.sendMessage("§b[모듈 로드] securityManager.js 연결 완료§r");

const panickingVillagers = new Map();

export function updateSecurity(villager) {
    // 1. 반경 15블록 내의 모든 엔티티를 일단 다 가져와서 체크해봅시다.
    const allEntities = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: 15
    });

    // 2. 몬스터(좀비 등)가 있는지 필터링
    const enemies = allEntities.filter(e => {
        // families에 "monster"나 "zombie"가 포함되어 있는지 확인
        const isMonster = e.getComponent("minecraft:type_family")?.hasTypeFamily("monster") || 
                          e.typeId.includes("zombie") || 
                          e.typeId.includes("skeleton");
        
        // 너무 멀리 있는(Y축) 적은 제외
        const isNearY = Math.abs(e.location.y - villager.location.y) < 10;
        
        return isMonster && isNearY && e.id !== villager.id;
    });

    if (enemies.length > 0) {
        const id = villager.id;
        if (!panickingVillagers.has(id)) {
            const enemy = enemies[0];
            const typeId = enemy.typeId; // 실제 인식된 ID 확인용
            
            showSpeechBubble(villager, `§4으악! 저기 괴물이다!§r`, 60, true);
            
            // [중요 디버그] 어떤 ID를 가진 엔티티를 감지했는지 채팅창에 강제 출력
            world.sendMessage(`§c[SECURITY CHECK] 주민이 엔티티 감지 성공: ${typeId}§r`);
            
            const tid = system.runTimeout(() => panickingVillagers.delete(id), 60);
            panickingVillagers.set(id, tid);
        }
        return true; 
    }

    // [감지 실패 디버그] 주변에 엔티티는 있는데 왜 몬스터로 인식 안 하는지 확인용
    // 너무 자주 뜨면 시끄러우니 테스트 때만 켜보세요.
    /*
    if (allEntities.length > 1) {
         world.sendMessage(`§7[LOG] 주변 엔티티 수: ${allEntities.length - 1}개 (몬스터 조건 불일치)§r`);
    }
    */

    return false;
}