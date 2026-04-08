import { world } from "@minecraft/server";

export const ScheduleState = {
    MORNING: "출근 중! 오늘도 열심히 일해야지.",
    AFTERNOON: "한창 일할 시간이야. 바쁘다 바빠!",
    EVENING: "드디어 퇴근! 마을 광장에서 수다나 떨까?",
    NIGHT: "졸려... 이제 자러 가야겠어."
};

// 직업별 고유 대사 데이터베이스
const ProfessionDialogs = {
    "minecraft:farmer": "오늘 감자가 풍년이네! 수확할 게 산더미야.",
    "minecraft:librarian": "새로운 마법 부여 책이 들어왔어. 구경해볼래?",
    "minecraft:cleric": "부정한 기운이 느껴지는군... 기도가 필요해.",
    "minecraft:fletcher": "화살촉을 더 날카롭게 갈아야겠어.",
    "minecraft:blacksmith": "뜨거운 화로 앞은 언제나 즐겁지!",
    "minecraft:none": "나도 빨리 내 적성을 찾고 싶어." // 무직 주민
};

export function getCurrentRoutine() {
    const time = world.getTimeOfDay();
    if (time >= 0 && time < 2000) return ScheduleState.MORNING;
    if (time >= 2000 && time < 12000) return ScheduleState.AFTERNOON;
    if (time >= 12000 && time < 14000) return ScheduleState.EVENING;
    return ScheduleState.NIGHT;
}

// 주민의 직업을 기반으로 특수 대사를 가져오는 함수
export function getJobMessage(villager) {
    // 주민의 직업 컴포넌트나 관련 태그를 확인할 수 없으므로, 
    // 실제로는 주민의 typeId나 variant를 활용하거나 간단하게 '가족(family)'으로 구분할 수도 있습니다.
    // 여기서는 가장 표준적인 variant(외형/직업) 기반 로직의 틀을 제안합니다.
    
    // 팁: 베드락 에디션에서 주민 직업은 보통 'variant' 값으로 구분됩니다.
    const variant = villager.getComponent("minecraft:variant")?.value;
    
    // 테스트를 위해 농부(variant: 0) 등으로 매핑하거나 기본값 제공
    if (variant === 0) return ProfessionDialogs["minecraft:farmer"];
    if (variant === 1) return ProfessionDialogs["minecraft:librarian"];
    
    return "오늘도 평화로운 마을이네.";
}