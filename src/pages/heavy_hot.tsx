import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Flame } from 'lucide-react'
import { handleLogout } from '@/lib/api';

const heavy_hot = () => {

    return (
        <StationLogin
            stationName="Peso Caliente"
            stationIcon={<Flame size={24} />}
            stationColor="bg-destructive"
            targetRole="pesador_caliente"
        >
            <button onClick={handleLogout} className="logout-btn">
                Cerrar Sesión
            </button>

            <h1>Heavy Hot</h1>
        </StationLogin>
    )
}

export default heavy_hot