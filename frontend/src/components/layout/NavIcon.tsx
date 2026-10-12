import { useNavigate, useLocation } from 'react-router-dom'
import "@/components/layout/NavIcon.css"

interface NavIconProps {
    icon: React.ReactNode
    label: string
    path: string
    badge?: number
}

const NavIcon = ({ icon, label, path, badge = 0 }: NavIconProps) => {
    const navigate = useNavigate()
    const location = useLocation()
    const isActive = location.pathname === path

    return (
        <button
            className={`nav-icon ${isActive ? 'nav-icon--active' : ''} ${badge > 0 ? 'nav-icon--badged' : ''}`}
            onClick={() => navigate(path)}
        >
            <span className="nav-icon__icon">
                {icon}
                {badge > 0 && (
                    <span className="nav-icon__badge">{badge > 9 ? "9+" : badge}</span>
                )}
            </span>
            <span className="nav-icon__label">{label}</span>
        </button>
    )
}

export default NavIcon