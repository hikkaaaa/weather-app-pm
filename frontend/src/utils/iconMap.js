import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSnow,
    Sun,
    Moon,
    CloudSun,
    CloudMoon
} from 'lucide-react';

export const getWeatherIcon = (weatherCode, isDay = true) => {
    // OpenWeatherMap icon codes:
    // 01d/n: clear sky
    // 02d/n: few clouds
    // 03d/n: scattered clouds
    // 04d/n: broken clouds
    // 09d/n: shower rain
    // 10d/n: rain
    // 11d/n: thunderstorm
    // 13d/n: snow
    // 50d/n: mist

    // You can pass the icon code string directly (e.g. "01d")
    const code = weatherCode.replace(/\D/g, ''); // extract number
    const dayOrNight = weatherCode.includes('n') ? 'n' : 'd';
    const isNight = dayOrNight === 'n';

    switch (code) {
        case '01':
            return isNight ? <Moon size={48} color="#ffd700" /> : <Sun size={48} color="#ffd700" />;
        case '02':
            return isNight ? <CloudMoon size={48} color="#c0c0c0" /> : <CloudSun size={48} color="#ffd700" />;
        case '03':
        case '04':
            return <Cloud size={48} color="#a0a0a0" />;
        case '09':
            return <CloudDrizzle size={48} color="#4fc3f7" />;
        case '10':
            return <CloudRain size={48} color="#29b6f6" />;
        case '11':
            return <CloudLightning size={48} color="#ffeb3b" />;
        case '13':
            return <CloudSnow size={48} color="#ffffff" />;
        case '50':
            return <CloudFog size={48} color="#cfd8dc" />;
        default:
            return <Sun size={48} color="#ffd700" />;
    }
};
