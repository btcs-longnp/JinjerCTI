import React, {FC, PropsWithChildren} from 'react';
import useSoftPhone from '../../hooks/useSoftPhone';

const AuthZone: FC<PropsWithChildren<{}>> = ({children}) => {
  useSoftPhone();

  return <>{children}</>;
};

export default AuthZone;
