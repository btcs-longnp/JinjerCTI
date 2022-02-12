import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { pureRegister, unregister } from '../services/asterisk';
import { currentUserState } from '../store/currentUserStore';

const useSoftPhone = () => {
  const currentUser = useRecoilValue(currentUserState);

  useEffect(() => {
    if (!currentUser || !currentUser.agent) {
      return;
    }

    const { sipAccount, sipPassword } = currentUser.agent;
    pureRegister(sipAccount, sipPassword);

    return () => {
      unregister();
    };
  }, [currentUser]);
};

export default useSoftPhone;
