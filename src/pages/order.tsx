import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Box } from 'lucide-react'

const order = () => {

    const credentials = {
        usuario: 'admin',
        contrasena: '123',
    }

    return (
        <StationLogin
            stationName="Orden"
            stationIcon={<Box size={24} />}
            stationColor="bg-primary"
            credentials={credentials}
        >
            <h1>Order</h1>
        </StationLogin>
    )
}

export default order