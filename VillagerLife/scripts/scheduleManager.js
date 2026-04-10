import { world } from "@minecraft/server";
// showSpeechBubble 대신 addDialogue를 임포트합니다.
import { addDialogue } from "./chatManager.js"; 

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

/**
 * 주민의 일상 루틴 대사를 체크하고 큐에 추가합니다.
 */
export function handleRoutineDialogue(villager) {
    const time = world.getTimeOfDay();
    let message = "";

    // 1. 아침 (0 ~ 2000): 출근 시간
    if (time >= 0 && time < 2000) {
        message = "출근 중! 오늘도 열심히 일해야지.";
    }
    // 2. 낮 (2000 ~ 9000): 업무 시간
    else if (time >= 2000 && time < 9000) {
        const villagerComp = villager.getComponent("minecraft:villager_v2");
        if (villagerComp) {
            const profession = villagerComp.profession;
            message = ProfessionDialogs[profession] || "오늘도 평화로운 마을이네. 일이나 마저 할까?";
        }
    }
    // 3. 늦은 오후 (9000 ~ 12000): 업무 마무리
    else if (time >= 9000 && time < 12000) {
        message = "한창 일할 시간이야. 바쁘다 바빠!";
    }
    // 4. 저녁 (12000 ~ 14000): 휴식
    else if (time >= 12000 && time < 14000) {
        message = "드디어 퇴근! 마을 광장에서 수다나 떨까?";
    }
    // 5. 밤 (14000 ~ 24000): 수면
    else {
        message = "졸려... 이제 자러 가야겠어. (Zzz...)";
    }

    // 일상 대사는 가장 낮은 우선순위인 1을 부여하여 큐에 추가합니다.
    if (message) {
        addDialogue(villager, message, 60, 1);
        return true;
    }

    return false;
}