import { world } from "@minecraft/server";

// 직업별 고유 대사 데이터베이스
const ProfessionDialogs = {
    "farmer": "오늘 감자가 풍년이네! 수확할 게 산더미야.",
    "librarian": "새로운 마법 부여 책이 들어왔어. 구경해볼래?",
    "cleric": "부정한 기운이 느껴지는군... 기도가 필요해.",
    "fletcher": "화살촉을 더 날카롭게 갈아야겠어.",
    "armorer": "뜨거운 화로 앞은 언제나 즐겁지! 단단한 갑옷이 필요해?",
    "weaponsmith": "날카로운 검 한 자루면 몬스터도 문제없지!",
    "toolsmith": "좋은 도구가 좋은 결과를 만드는 법이야.",
    "none": "나도 빨리 내 적성을 찾고 싶어. 마을에 빈 작업대가 있나?"
};

export function getRoutineMessage(villager) {
    const time = world.getTimeOfDay();

    // 1. 아침 (0 ~ 2000): 출근 시간
    if (time >= 0 && time < 2000) {
        return "출근 중! 오늘도 열심히 일해야지.";
    }
    
    // 2. 낮 (2000 ~ 9000): 업무 시간
    if (time >= 2000 && time < 9000) {
        // v2 주민 컴포넌트에서 직업 정보 가져오기
        const villagerComp = villager.getComponent("minecraft:villager_v2");
        
        if (villagerComp) {
            const profession = villagerComp.profession; // 실제 직업 ID (문자열)
            
            // 데이터베이스에 해당 직업의 대사가 있다면 반환
            if (ProfessionDialogs[profession]) {
                return ProfessionDialogs[profession];
            }
        }
        return "오늘도 평화로운 마을이네. 일이나 마저 할까?";
    }

    // 3. 늦은 오후 (9000 ~ 12000): 업무 마무리
    if (time >= 9000 && time < 12000) {
        return "한창 일할 시간이야. 바쁘다 바빠!";
    }
    
    // 4. 저녁 (12000 ~ 14000): 휴식
    if (time >= 12000 && time < 14000) {
        return "드디어 퇴근! 마을 광장에서 수다나 떨까?";
    }
    
    // 5. 밤 (14000 ~ 24000): 수면
    return "졸려... 이제 자러 가야겠어. (Zzz...)";
}