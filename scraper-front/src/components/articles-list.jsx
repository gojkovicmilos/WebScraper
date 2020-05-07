import React,{ useState, useEffect, useImperativeHandle} from 'react';

import firebase, { analytics, auth, firestore, storage } from '../firebase';

import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import { red } from '@material-ui/core/colors';
import FavoriteIcon from '@material-ui/icons/Favorite';
import ShareIcon from '@material-ui/icons/Share';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 275,

  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  tags: {
    display: 'grid',
    gridTtemplateColumns: 'auto auto auto',
    gridTemplateRows: 'auto auto',
    padding: '10px',
    gridAutoFlow: 'column'
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
}));


function useArticles() {

    

    const [articles, setArticles] = useState([]); 

    useEffect(() => {

        firestore.collection('articles').onSnapshot((snapshot) => {

            const newArticles = snapshot.docs.map((doc) => ({

                id: doc.id,
                ...doc.data()
            }))

            setArticles(newArticles);

        })



    }, [])

    return articles;

}

const ArticlesList = () => {

    const articles = useArticles();
    const classes = useStyles();

    const [expandedId, setExpandedId] = React.useState(-1);

    const handleExpandClickId = i => {
      setExpandedId(expandedId === i ? -1 : i);
    };


    const [expanded, setExpanded] = React.useState(false);

    const handleExpandClick = () => {
      setExpanded(!expanded);
    };

    return (
        <div>
            <h2>Articles List</h2>
            <Grid container spacing = {3}>
                
                    {articles.map((article, i) => 
                    <Grid item xs={3}>
                        <div ></div>
                        <Card className={classes.root} key = {article.id}>
                        <CardContent>
                          <Typography className={classes.title} color="textSecondary" gutterBottom>
                            Source: {article.source}
                          </Typography>
                          <Typography variant="h5" component="h2">
                            <a href={article.url}>{article.title}</a>
                          </Typography>
                          <div className={classes.tags}>
                          {article.tags.map(tag =>
                          <Typography className={classes.pos} color="textSecondary">
                          {tag}
                            </Typography>
                            )}
                          </div>
                        </CardContent>
                        <CardActions disableSpacing>
                          <IconButton
                            className={clsx(classes.expand, {
                              [classes.expandOpen]: expandedId,
                            })}
                            onClick={() => handleExpandClickId(i)}
                            aria-expanded={expandedId === i}
                            aria-label="show more"
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                        </CardActions>
                        <Collapse in={expandedId === i} timeout="auto" unmountOnExit>
                          <CardContent>
                          <Typography paragraph>{article.content}</Typography>

                          </CardContent>
                        </Collapse>
                      </Card>
                    </Grid>
                    )}
                    
                
            </Grid>
        </div>
    )
}

export default ArticlesList;