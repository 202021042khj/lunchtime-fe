// 기상청 강수형태(PTY)가 있으면 그 값, 없으면 하늘상태(SKY)로 정한다
export type WeatherCondition = "clear" | "cloudy" | "overcast" | "rain" | "sleet" | "snow";

export interface Weather {
  tempC: number;
  condition: WeatherCondition;
  label: string;
  highC: number | null;
  lowC: number | null;
}
