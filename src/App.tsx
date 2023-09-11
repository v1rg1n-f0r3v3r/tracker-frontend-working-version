import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios'
import * as Mui from '@mui/material';
import * as MuiIcons from '@mui/icons-material';

export default function App() {

  // переменные и состояния
  const [workType, setTypeOfWork] = React.useState('');
  const [isBlockedFIO, setIsBlockedFIO] = React.useState(false);
  const [isBlocedCoords, setIsBlocedCoords] = React.useState(true);
  const [project, setProject] = React.useState('');
  const [Start, setStart] = useState({ text: "start" });
  const [coords, setCoords] = useState({
    latitude: 0,
    longitude: 0
  });
  const [timeleft, setTimeLeft] = useState(0)

  const isDisabled = React.useMemo(() => !workType || !project, [workType, project])

  const getPadTime = (time: any) => time.toString().padStart(2, "0")

  const hours = getPadTime(Math.floor(timeleft / 3600))
  const minutes = getPadTime(Math.floor((timeleft - hours * 3600) / 60));
  const seconds = getPadTime(Math.floor((timeleft - minutes * 60 - hours * 3600)));

  const [isCounting, setIsCounting] = useState(false)
  const telegramData = (window as any).Telegram.WebApp
  const chat_Id = telegramData?.initDataUnsafe?.user?.id;
  // const chat_Id = 1045906995;

  const userData = {
    ChatId: chat_Id,  // сделать аунтификацию в телеграмм
    Name: project,
    Description: workType,
    Coordinates: coords
  }

  const checkCondition = async (): Promise<boolean> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const updatedCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setCoords(updatedCoords);
      return false;
    } catch (error) {
      console.error("Ошибка получения координат GPS:", error);
      return true;
    }
  };

  type PostTaskEntity =
    {
      fio: string,
      taskName: string,
      taskDescription: string,
      startTime: string,
    }

  const GetInitData = useCallback(async () => {
    const initData = await axios.get<PostTaskEntity>(`https://stagebot.element-it.ru/Task/GetInitData/?chatId=${chat_Id}`);
    if (!initData.data.fio) {
      setIsBlockedFIO(true);
    }
    if (!!initData.data.taskDescription) {
      setTypeOfWork(initData.data.taskDescription)
    }
    if (!!initData.data.startTime) {
      const startTime = new Date(initData.data.startTime);
      const currentTime = new Date();
      const TimesLeft = (currentTime.getTime() - startTime.getTime()) / 1000;
      setTimeLeft(TimesLeft);
      setIsCounting(true);
      setStart({ text: "stop" });
    }
  }, []);

  useEffect(() => {
    GetInitData();
    checkGPS();
    checkInternetConnection()
  }, [GetInitData]);

  async function checkGPS() {
    if (await checkCondition()) {
      setIsBlocedCoords(true);
    } else {
      setIsBlocedCoords(false);
    }
  }

  useEffect(() => {
    setTypeOfWork("Электромонтажные работы");
    setProject("1");
    const interval = setInterval(() => {
      isCounting &&
        setTimeLeft((timeleft) => (timeleft + 1));
    }, 1000);
    return () => {
      clearInterval(interval)
    }
  }, [isCounting]);

  function checkInternetConnection() {
    if (navigator.onLine) {
      console.log("Online")
      return true;
    }
    console.log("Offline")
    return false;
  }


  // обработчики

  const handleClick = () => {
    if (Start.text === "start") {
      setStart({ text: "stop" });
      axios.post("https://stagebot.element-it.ru/Task/StartButtonPost", userData).then((response) => {
      });
      setIsCounting(true);
      // checkInternetConnection();
    }

    else {
      setStart({ text: "start" });
      // checkInternetConnection();
      setIsCounting(false);
      setProject("");
      setTypeOfWork("");
      setTimeLeft(0);
      axios.post("https://stagebot.element-it.ru/Task/StopButtonPost", userData).then((response) => {
      });
    }
  };

  if (isBlockedFIO) {
    return <span>Вы не указали контактные данные. Пожалуйста, вернитесь в бот и укажите ФИО</span>
  }
  if (isBlocedCoords) {
    return <span>Вы не дали доступ к геолокации. Пожалуйста, перезайдите в трекер и дайте доступ к геоданным</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Выберите проект</h2>
      <Mui.FormControl sx={{ m: 1, minWidth: 120 }}>
        <Mui.InputLabel id="choose-project">Проект</Mui.InputLabel>
        <Mui.Select
          labelId="choose-project-label"
          id="choose-project"
          value={project}
          onChange={(event) => setProject(event.target.value)}
          autoWidth
          label="Project"
        >
          <Mui.MenuItem value={1}>Протон ПМ</Mui.MenuItem>
        </Mui.Select>
      </Mui.FormControl>

      <h2>Введите описание задачи</h2>
      <Mui.TextField
        id="typeOfWork"
        label="Тип работы"
        value={workType}
        variant="standard"
        onChange={(event) => setTypeOfWork(event.target.value)}
      />

      <h2>Таймер</h2>
      <div>{hours}:{minutes}:{seconds}</div>

      <Mui.IconButton onClick={handleClick} disabled={isDisabled} >
        {Start.text === "start" ?
          <MuiIcons.PlayArrowRounded sx={{ width: 200, height: 200, }} color={isDisabled ? 'inherit' : 'success'} /> :
          <MuiIcons.StopCircle sx={{ width: 200, height: 200, }} color="error" />
        }
      </Mui.IconButton>
    </div>
  );
}

