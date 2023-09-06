import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios'
import * as Mui from '@mui/material';
import * as MuiIcons from '@mui/icons-material';

export default function App() {

  // переменные и состояния
  const [workType, setTypeOfWork] = React.useState('');
  const [isBlocked, setIsBlocked] = React.useState(false);
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

  const userData = {
    ChatId: chat_Id,  // сделать аунтификацию в телеграмм
    Name: project,
    Description: workType
  }

  type PostTaskEntity =
    {
      fio: string,
      taskName: string,
      taskDescription: string,
      startTime: string,
    }

  const GetInitData = useCallback(async () => {
    const initData = await axios.get<PostTaskEntity>(`https://afc5-89-250-212-72.ngrok.io/Task/GetInitData/?chatId=${chat_Id}`);
    // const initData =
    // {
    //   data:
    //   {
    //     fio: "asdsada",
    //     taskName: "fasdsaf",
    //     taskDescription: "dassadas",
    //     startTime: "2023-09-05T13:51:52.242Z",
    //   }
    // }
    if (!initData.data.fio) {
      setIsBlocked(true);
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
    GetCoords();
  }, [GetInitData]);

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

  // обработчики
  const GetCoords = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      }
    )
  }
  const handleClick = () => {
    if (Start.text === "start") {

      const now = new Date()
      setStart({ text: "stop" });
      axios.post("https://afc5-89-250-212-72.ngrok.io/Task/StartButtonPost", userData).then((response) => {
      });
      setIsCounting(true);
    }

    else {
      setStart({ text: "start" });
      setIsCounting(false)
      setProject("")
      setTypeOfWork("")
      setTimeLeft(0)
      axios.post(`https://afc5-89-250-212-72.ngrok.io/Task/StopButtonPost?chatId=${chat_Id}`).then((response) => {
      });
    }
  };

  if (isBlocked) {
    return <span>Вы не указали контактные данные. Пожалуйста, вернитесь в бот и укажите ФИО</span>
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
      <span>{coords.latitude}/{coords.longitude}</span>
    </div>
  );
}