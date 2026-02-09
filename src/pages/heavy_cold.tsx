import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Snowflake } from 'lucide-react'

const heavy_cold = () => {

    const credentials = {
        usuario: 'admin',
        contrasena: '123',
    }

    return (
        <StationLogin
            stationName="Peso Frío"
            stationIcon={<Snowflake size={24} />}
            stationColor="bg-destructive"
            credentials={credentials}
        >
            <h1>Heavy Cold</h1>
        </StationLogin>
    )
}

export default heavy_cold