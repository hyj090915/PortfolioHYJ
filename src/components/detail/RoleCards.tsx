import type { Role } from '@/types/project';

export default function RoleCards({ roles }: { roles: Role[] }) {
  return (
    <div className="roles">
      {roles.map(([name, note, items]) => (
        <div className="role-c" key={name}>
          <h5>{name}<small>{note}</small></h5>
          <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
