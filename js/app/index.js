import { initAuthGateAndHeader } from "./main.js";
import { initClock } from "./clock.js";
import { initDefaultBackground } from "../ext/background.js";
import { initBgUpload } from "../ext/bg.upload.js";
import { initWeather } from "./weather.js";

// 1) 로그인 체크 + 헤더 세팅
initAuthGateAndHeader();

// 2) 시계
initClock();

// 3) 배경 (기본 적용 + 커스텀 업로드/리셋)
initDefaultBackground();
initBgUpload();

// 4) 날씨
initWeather();