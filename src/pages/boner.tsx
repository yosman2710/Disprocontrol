import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Bone } from 'lucide-react'

const Boner = () => {

    const credentials = {
        usuario: 'admin',
        contrasena: '123',
    }

    return (
        <StationLogin
            stationName="Boner"
            stationIcon={<Bone size={24} />}
            stationColor="bg-destructive"
            credentials={credentials}
        >
            <h1>Boner</h1>
        </StationLogin>
    )
}

export default Boner