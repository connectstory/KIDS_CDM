import { type FormEvent, useEffect, useState } from "react";
import { Button, InputBase, Paper, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types.ts";
import styles from "./CdmPaginationMove.module.scss";

interface PaginationMoveProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CdmPaginationMove({ currentPage, totalPages, onPageChange }: PaginationMoveProps) {
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState<string>(() => String(currentPage));

  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const p = parseInt(pageParam, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        setInputValue(String(p));
      }
    } else {
      setInputValue(String(currentPage));
    }
  }, [searchParams, totalPages, currentPage]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const page = parseInt(inputValue, 10);

    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setInputValue("");
    }
  };

  return (
    <Stack direction="row" alignItems={"center"} className={styles.paging_move} gap={CONTENT_GAP.SMALL}>
      <Stack direction="row" className="" gap={CONTENT_GAP.SMALL}>
        <Typography className="" color="primary" fontWeight={600}>
          {currentPage}
        </Typography>{" "}
        / <Typography className="">{totalPages}</Typography>
      </Stack>
      <Paper component="form" variant="outlined" onSubmit={handleSubmit}>
        <InputBase
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 3) {
              setInputValue(value);
            }
          }}
          type="number"
          sx={{
            "& input[type=number]": {
              fontSize: "0.95rem",
              textAlign: "center",
              MozAppearance: "textfield",
              "&::-webkit-outer-spin-button": {
                WebkitAppearance: "none",
                margin: 0,
              },
              "&::-webkit-inner-spin-button": {
                WebkitAppearance: "none",
                margin: 0,
              },
            },
          }}
          inputProps={{
            min: 1,
            max: totalPages,
            style: {
              width: 40,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          aria-label="페이지 이동"
          sx={{
            minWidth: "unset",
            width: 40,
            maxWidth: 40,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            padding: 0,
          }}
        >
          <Typography variant="body4" fontWeight={600}>
            이동
          </Typography>
        </Button>
      </Paper>
    </Stack>
  );
}
