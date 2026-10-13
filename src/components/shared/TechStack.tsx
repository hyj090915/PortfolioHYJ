interface TechStackProps {
  items: string[];
  className?: string;
}

/** Vendored brand artwork; download sources and licenses live beside the SVGs. */
const TECH_ICONS: Record<string, string> = {
  React: 'react',
  TypeScript: 'typescript',
  'Spring Boot': 'springboot',
  MySQL: 'mysql',
  Flutter: 'flutter',
  Firebase: 'firebase',
  'AWS EC2': 'amazon-ec2',
  EC2: 'amazon-ec2',
  Nginx: 'nginx',
  Java: 'java',
  PostgreSQL: 'postgresql',
  'Claude API': 'claude',
  Python: 'python',
  FastAPI: 'fastapi',
  OpenAI: 'openai',
  'Naver 쇼핑 API': 'naver',
};

export default function TechStack({ items, className = '' }: TechStackProps) {
  return (
    <ul className={`tech-stack ${className}`.trim()} aria-label="기술 스택">
      {items.map((label) => {
        const icon = TECH_ICONS[label];
        return (
          <li key={label} className="tech-stack__item">
            {icon && (
              <span className="tech-stack__icon" aria-hidden="true">
                <img src={`${import.meta.env.BASE_URL}icons/tech/${icon}.svg`} alt="" width={18} height={18} loading="lazy" decoding="async" />
              </span>
            )}
            <span className="tech-stack__label">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
