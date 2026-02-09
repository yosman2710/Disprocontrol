import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Flame } from 'lucide-react'

const heavy_hot = () => {

    const credentials = {
        usuario: 'admin',
        contrasena: '123',
    }

    return (
        <StationLogin
            stationName="Peso Caliente"
            stationIcon={<Flame size={24} />}
            stationColor="bg-destructive"
            credentials={credentials}
        >
            <h1>Heavy Hot</h1>
        </StationLogin>
    )
}

export default heavy_hot